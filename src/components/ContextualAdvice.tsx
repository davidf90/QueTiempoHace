/* COMPONENTE PARA MOSTRAR CONSEJOS CONTEXTUALES BASADOS EN EL CLIMA */
import '../styles/App.css';

/* Props del componente: recibe un array de consejos */
interface ContextualAdviceProps {
    advice: string[];
}


/* Componente que muestra consejos contextuales basados en el clima */
export function ContextualAdvice({ advice }: ContextualAdviceProps) {
    /* Si no hay consejos, no renderiza nada */
    if (!advice.length) return null;

    /* Renderiza la lista de consejos */
    return (
        <div className="advice-container">
            <h3 className="advice-title">💡 Consejos para hoy</h3>
            <ul className="advice-list">
                {advice.map((tip, index) => (
                    /* Renderiza cada consejo en un elemento de lista */
                    <li key={index} className="advice-item">
                        {tip}
                    </li>
                ))}
            </ul>
        </div>
    );
}
