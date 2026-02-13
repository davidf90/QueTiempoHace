/* UTILIDADES PARA EL MANEJO DE DATOS DEL CLIMA */

/* Convierte un timestamp UNIX a "Hace X minutos/horas" */
export function getTimeAgo(timestamp: number): string {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) {
        return 'Hace unos segundos';
    } else if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        return `Hace ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
    } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else {
        const days = Math.floor(diff / 86400);
        return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
    }
}

/* Formatea un timestamp UNIX a hora local (HH:MM) */
export function formatTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/* Convierte grados de dirección del viento a dirección cardinal */
export function getWindDirection(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

/* Estructura de condiciones meteorológicas para consejos */
export interface WeatherConditions {
    tipo: string;
    temperatura: number;
    sensacionTermica: number;
    humedad: number;
    vientoVelocidad: number;
    lluvia?: number;
    nieve?: number;
}

/* Genera consejos contextuales basados en las condiciones del clima */
export function getContextualAdvice(conditions: WeatherConditions): string[] {

    const advice: string[] = [];

    /* Consejos por tipo de clima */
    if (['rain', 'drizzle', 'thunderstorm'].includes(conditions.tipo)) {
        advice.push('🌂 No olvides llevar paraguas');
    }

    if (conditions.tipo === 'thunderstorm') {
        advice.push('⚡ Evita salir durante la tormenta si es posible');
    }

    if (conditions.tipo === 'snow') {
        advice.push('❄️ Ten cuidado con las superficies resbaladizas');
    }

    /* Consejos por temperatura */
    if (conditions.temperatura >= 30) {
        advice.push('☀️ Usa protector solar y mantente hidratado');
    }

    if (conditions.temperatura <= 5) {
        advice.push('🧥 Abrígate bien, hace mucho frío');
    }

    /* Consejos por viento */
    if (conditions.vientoVelocidad >= 10) {
        advice.push('💨 Viento fuerte: no recomendado para ciclismo');
    }

    if (conditions.vientoVelocidad >= 15) {
        advice.push('🌪️ Viento muy fuerte: asegura objetos en exteriores');
    }

    /* Consejos por diferencia de sensación térmica */
    const diffSensacion = conditions.temperatura - conditions.sensacionTermica;
    if (diffSensacion >= 5) {
        advice.push('🥶 La sensación térmica es mucho menor por el viento');
    }

    /* Consejos por humedad */
    if (conditions.humedad >= 80 && conditions.temperatura >= 25) {
        advice.push('💧 Alta humedad: el calor se siente más intenso');
    }

    /* Si no hay consejos específicos */
    if (advice.length === 0) {
        if (conditions.tipo === 'clear') {
            advice.push('☀️ ¡Buen día para actividades al aire libre!');
        } else {
            advice.push('👍 Condiciones moderadas para salir');
        }
    }


    /* CONSEJOS PARA CONSIDERAR EL DÍA COMPLETO, Y NO EL TIEMPO SOLO EN ESE MOMENTO */
    /* Lluvia reciente o humedad alta: suelo mojado aunque esté despejado */
    if (
        conditions.tipo === 'clear' &&
        (conditions.lluvia || conditions.humedad >= 75)
        ) {
        advice.push(
            '🌦️ Aunque ahora esté despejado, podría haber llovido antes. Precaución con superficies mojadas.'
        );
    }

    /* Clima inestable durante el día */
    if (
        ['clouds', 'rain', 'drizzle'].includes(conditions.tipo) &&
        conditions.humedad >= 70
        ) {
        advice.push(
            '🌥️ El tiempo podría cambiar a lo largo del día. Mejor llevar una prenda extra.'
        );
    }

    /* Tormenta o viento: posible empeoramiento posterior */
    if (
        conditions.tipo === 'thunderstorm' ||
        conditions.vientoVelocidad >= 12
        ) {
        advice.push(
            '⏱️ Las condiciones podrían empeorar más adelante. Evita planes largos al aire libre.'
        );
    }

    /* Niebla persistente */
    if (conditions.tipo === 'fog' || conditions.humedad >= 85) {
        advice.push(
            '🌫️ Puede que haya niebla que persista durante horas. Conduce con precaución.'
        );
    }

    /* Mucha humedad y calor: empeora con el día */
    if (conditions.humedad >= 70 && conditions.temperatura >= 28) {
        advice.push(
            '🥵 El calor puede volverse más incómodo conforme avance el día.'
        );
    }

    return advice;
}

/* Genera una explicación de la sensación térmica */
export function explainFeelsLike(
    temp: number,
    feelsLike: number,
    windSpeed: number,
    humidity: number
): string {
    const diff = Math.abs(temp - feelsLike);

    /* Si la diferencia es menor a 2 grados, mejor poner un comentario vacío */
    if (diff < 2) {
        return '';
    }

    const reasons: string[] = [];

    /* En el caso de que haya una diferencia significativa */
    if (feelsLike < temp) {
        if (windSpeed >= 5) {
            reasons.push('el viento');
        }
        if (humidity < 30) {
            reasons.push('la baja humedad');
        }
        return `Se siente más frío debido a: ${reasons.join(' y ') || 'las condiciones actuales'}.`;
    } else {
        if (humidity >= 60) {
            reasons.push('la alta humedad');
        }
        if (windSpeed < 2) {
            reasons.push('la falta de viento');
        }
        return `Se siente más calor debido a: ${reasons.join(' y ') || 'las condiciones actuales'}.`;
    }
}

/* Convierte temperatura entre Celsius y Fahrenheit */
export function convertTemp(temp: number, toUnit: 'C' | 'F'): number {
    if (toUnit === 'F') {
        return (temp * 9) / 5 + 32;
    }
    return ((temp - 32) * 5) / 9;
}

/* Convierte velocidad del viento entre m/s y mph */
export function convertWindSpeed(
    speed: number,
    toUnit: 'metric' | 'imperial'
): number {
    if (toUnit === 'imperial') {
        return speed * 2.237; // m/s to mph
    }
    return speed / 2.237; // mph to m/s
}
