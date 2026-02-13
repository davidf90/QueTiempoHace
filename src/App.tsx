import React, { useState, useRef, useEffect, useMemo } from 'react';
import './styles/App.css';
import { WeatherCard, type WeatherData } from './components/WeatherCard';
import { ContextualAdvice } from './components/ContextualAdvice';
import { Settings } from './components/Settings';
import { useSettings } from './hooks/useSettings';
import { getContextualAdvice, convertTemp } from './utils/weatherUtils';


export default function App() {

  /* Ciudad introducida por el usuario en el buscador */
  const [ciudad, setCiudad] = useState<string>('');
  
  /* Datos completos del clima de la ciudad buscada */
  const [datosClima, setDatosClima] = useState<WeatherData | null>(null);
  
  /* Coordenadas geográficas de la ciudad */
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lon: number } | null>(null);
  
  /* Indica si se está cargando la información del clima */
  const [cargando, setCargando] = useState<boolean>(false);
  
  /* Mensaje de error si algo falla en la búsqueda */
  const [error, setError] = useState<string | null>(null);
  
  /* Unidades de medida (métrico o imperial) y función para alternar */
  const { units, toggleUnits } = useSettings();
  
  /* URL base de la API de OpenWeatherMap */
  const urlBase = 'https://api.openweathermap.org/data/2.5/weather';
  
  /* Clave API cargada desde variables de entorno */
  const api_key = import.meta.env.VITE_OPENWEATHER_KEY;
  
  /* Diferencia entre Kelvin y Celsius (273.15) para convertir temperaturas */
  const difKelvin = 273.15;
  
  /* Estado para activar/desactivar el sonido del clima */
  const [soundEnabled, setSoundEnabled] = useState(true);

  /* Lista de sonidos de fondo que sonarán según el clima (la web de la api no contempla trueno con lluvia) */
  const weatherTracks = useMemo(() => [
    { tipo: 'clear', title: 'Día soleado', src: '/sounds/soleado.mp3' },
    { tipo: 'rain', title: 'Lluvia', src: '/sounds/lluvia.mp3' },
    { tipo: 'drizzle', title: 'Llovizna', src: '/sounds/lluvia.mp3' },
    { tipo: 'thunderstorm', title: 'Tormenta', src: '/sounds/tormenta.mp3' },
    { tipo: 'snow', title: 'Nieve', src: '/sounds/nevado.mp3' },
    { tipo: 'fog', title: 'Niebla', src: '/sounds/niebla.mp3' },
  ], []);

  /* Normaliza el tipo de clima para agrupar variantes similares */
  const normalizeWeatherType = (tipo: string): string => {

    // Se agrupan varios tipos de clima similares a niebla
    if (['mist', 'fog', 'haze', 'smoke', 'dust', 'sand', 'ash'].includes(tipo)) {
      return 'fog';
    }
    // Se agrupan la llovizna con la lluvia normal, ya que no he puesto un sonido concreto para la llovizna
    if (tipo === 'drizzle') {
      return 'rain';
    }

    return tipo;
  };

  /* Referencias para el manejo de audio (Web Audio API) */
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  /* Reproduce el sonido correspondiente al clima en bucle */
  const playLoopingSound = async (src: string) => {

    // Crear contexto de audio si no existe
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      gainRef.current = audioContextRef.current.createGain();
      gainRef.current.gain.value = soundEnabled ? 0.5 : 0;
      gainRef.current.connect(audioContextRef.current.destination);
    }
    const ctx = audioContextRef.current;

    // Parar sonido anterior si existe
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
    }

    // Cargar y reproducir el nuevo audio
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;
    source.connect(gainRef.current!);
    source.start(0);
    sourceRef.current = source;
  };

  /* Permite buscar al presionar Enter en la barra de input */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarClima();
    }
  };

  /* Busca el clima de la ciudad introducida */
  const buscarClima = async () => {
    if (!ciudad.trim()) return;
    setError(null);
    await fetchClima(`q=${ciudad}&lang=es`);
  };

  /* Convierte la temperatura a la unidad seleccionada */
  const convertTemperature = (tempCelsius: number): number => {
    return units === 'imperial' ? convertTemp(tempCelsius, 'F') : tempCelsius;
  };

  /* Llama a la API y obtiene los datos del clima para la ciudad buscada */
  const fetchClima = async (queryParams: string) => {

    // Indica que se está cargando y limpia datos anteriores
    setCargando(true);

    try {
      // Fetch a la API con el término de búsqueda (ej: "q=ciudad" o "lat=..&lon=..")
      const response = await fetch(`${urlBase}?q=${ciudad}&appid=${api_key}&lang=es`);
      const data = await response.json();

      // Validar respuesta de la API
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No se ha encontrado esa ciudad 🤔');
        }
        throw new Error('Error al obtener los datos del tiempo');
      }

      // Validar que no se busque por nombre de país
      const searchTerm = ciudad.trim().toLowerCase();
      const countryCode = data.sys.country?.toLowerCase() || '';

      // Lista de nombres de países comunes para validar que no se busque por nombre de país
      const paises: string | string[] = [ /* ...lista de países... */ ];

      // Si el término buscado es un país conocido, rechazar
      if (paises.includes(searchTerm)) {
        throw new Error('Por favor, busca una ciudad, no un país 🏙️');
      }

      // Si el término buscado coincide con el código del país (ej: "ES", "FR")
      if (searchTerm === countryCode || searchTerm.length === 2 && searchTerm === countryCode) {
        throw new Error('Por favor, busca una ciudad, no un código de país 🏙️');
      }

      // Guardar coordenadas si no las tenemos
      if (!coordenadas && data.coord) {
        setCoordenadas({ lat: data.coord.lat, lon: data.coord.lon });
      }

      // Guardar los datos del clima en el estado, convirtiendo de Kelvin a Celsius
      setDatosClima({
        nombre: data.name,
        pais: data.sys.country,
        temperatura: data.main.temp - difKelvin,
        tempMax: data.main.temp_max - difKelvin,
        tempMin: data.main.temp_min - difKelvin,
        sensacionTermica: data.main.feels_like - difKelvin,
        humedad: data.main.humidity,
        descripcion: data.weather[0].description,
        icono: data.weather[0].icon,
        tipo: data.weather[0].main.toLowerCase(),
        vientoVelocidad: data.wind.speed,
        vientoDireccion: data.wind.deg || 0,
        amanecer: data.sys.sunrise,
        atardecer: data.sys.sunset,
        actualizadoEn: data.dt,
        lluvia: data.rain?.['1h'],
        nieve: data.snow?.['1h'],
        timezone: data.timezone,
      });
    } catch (err) {
      setDatosClima(null);
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  };


  /* Obtiene los consejos contextuales según el clima actual */
  const advice = datosClima
    ? getContextualAdvice({
      tipo: datosClima.tipo,
      temperatura: datosClima.temperatura,
      sensacionTermica: datosClima.sensacionTermica,
      humedad: datosClima.humedad,
      vientoVelocidad: datosClima.vientoVelocidad,
      lluvia: datosClima.lluvia,
      nieve: datosClima.nieve,
    })
    : [];


  /* Prepara los datos del clima con las unidades convertidas */
  const datosConvertidos = datosClima ? {
      ...datosClima,
      temperatura: convertTemperature(datosClima.temperatura),
      tempMax: convertTemperature(datosClima.tempMax),
      tempMin: convertTemperature(datosClima.tempMin),
      sensacionTermica: convertTemperature(datosClima.sensacionTermica),
      vientoVelocidad:
        units === 'imperial'
          ? datosClima.vientoVelocidad * 2.237
          : datosClima.vientoVelocidad,
  } : null;


  /* Efecto: cuando cambia el clima, reproduce el sonido adecuado */
  useEffect(() => {
    
    // Si no hay datos del clima, no hacer nada
    if (!datosClima) return;

    // Normalizar el tipo de clima para agrupar variantes similares
    const weatherType = normalizeWeatherType(datosClima.tipo);

    // Calcular si es de día en la ciudad buscada
    const horaCiudad = new Date(
      (datosClima.actualizadoEn + datosClima.timezone) * 1000
    ).getUTCHours();

    // Se considera de forma general que es de día entre las 9:00 y las 19:00 horas
    const esDiaEnCiudad = horaCiudad >= 9 && horaCiudad < 19;

    // Si es de noche y el clima es "clear" (soleado), no reproducir sonido
    if (weatherType === 'clear' && !esDiaEnCiudad) {
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
          sourceRef.current.disconnect();
        } catch (e) {
          // El audio ya estaba detenido
        }
        sourceRef.current = null;
      }
      return;
    }

    // Buscar la pista de sonido correspondiente al tipo de clima
    const track = weatherTracks.find(t => t.tipo === weatherType);

    // Si no hay pista para este tipo de clima, no hacer nada
    if (!track) return;

    // Reproducir el sonido en bucle
    playLoopingSound(track.src);

    // Cleanup: parar el sonido cuando el efecto se dispare nuevamente
    return () => {
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
          sourceRef.current.disconnect();
        } catch (e) {
          // El audio ya estaba detenido
        }
        sourceRef.current = null;
      }
    };
  }, [datosClima]);


  /* Efecto: actualiza el volumen del sonido cuando se activa/desactiva */
  useEffect(() => {
    if (!gainRef.current) return;
    gainRef.current.gain.value = soundEnabled ? 0.5 : 0;
  }, [soundEnabled]);

  /* Componentes para efectos visuales según el clima */
  function RainEffect() {
    return <div className="lluvia" />;
  }
  function SnowEffect() {
    return <div className="nieve" />;
  }
  function ThunderstormEffect() {
    return <div className="tormenta" />;
  }
  function FogEffect() {
    return <div className="niebla" />;
  }



  /* Determina si es de día o de noche en la ciudad buscada */
  let esDia = true;

  // Si hay datos del clima, usamos la hora local de la ciudad para determinar si es de día o de noche
  if (datosClima) {

    const horaCiudad = new Date(

      (datosClima.actualizadoEn + datosClima.timezone) * 1000
    ).getUTCHours();
    esDia = horaCiudad >= 9 && horaCiudad < 19;
  } else {
    // Si no hay ciudad buscada → usamos hora local del navegador
    const horaLocal = new Date().getHours();
    esDia = horaLocal >= 9 && horaLocal < 19;
  }


  return (
    
    // La clase del contenedor principal cambia según el tipo de clima, y si es de día o de noche, para aplicar diferentes fondos
    <div className={`app-container clima-${datosClima?.tipo || 'default'} ${esDia ? 'modo-dia' : 'modo-noche'}`}>
      
      {/* Dependiendo de si entras a la página de día o de noche, el fondo es distinto */}
      <div className="time-overlay" />

      {/* Efectos de clima */}
      {['rain', 'drizzle', 'thunderstorm'].includes(datosClima?.tipo ?? '') && <RainEffect />}
      {datosClima?.tipo === 'thunderstorm' && <ThunderstormEffect />}
      {datosClima?.tipo === 'snow' && <SnowEffect />}
      {['mist', 'fog', 'haze', 'smoke', 'dust', 'sand', 'ash'].includes(datosClima?.tipo ?? '') && <FogEffect />}

      {/* Configuración */}
      <Settings
        units={units}
        onToggleUnits={toggleUnits}
      />
      <div className="contenedor">

        {/* Botón para activar/desactivar sonido */}
        {datosClima && (
          <button
            className="sound-toggle-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        )}

        {/* Cabecera de la aplicación */}
        <header className="app-header">

          <h1> ¿QUÉ TIEMPO HACE? </h1>

          <p className="app-subtitle"> Consulta el clima de cualquier ciudad </p>
        </header>

        {/* Barra de búsqueda */}
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              id="ciudadEntrada"
              placeholder="Buscar ciudad..."
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button id="botonBusqueda" onClick={buscarClima} disabled={cargando}>
              🔍
            </button>
          </div>
          {/* Botón de 'Usar mi ubicación' eliminado */}
        </div>

        {/* Estados de carga y error */}
        {cargando && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando datos del clima...</p>
          </div>
        )}

        {error && <p className="error-msg">{error}</p>}

        {/* Datos del clima */}
        {datosConvertidos && !cargando && (
          <>
            <WeatherCard data={datosConvertidos} units={units} />
            <ContextualAdvice advice={advice} />
          </>
        )}
      </div>
    </div>
  );
}
