import './EventHub.css';

const EventCard = ({evento, onSeleccion}) => {
  return (
    <article className={`event-card${evento.cupos === 0 ? ' event-card--agotado' : ''}`}>
      <h2>{evento.nombre}</h2>
      <p>{evento.descripcion}</p>
      <p className="cupos">Cupos disponibles: {evento.cupos}</p>
      <button
        disabled={evento.cupos === 0}
        onClick={onSeleccion}
      >
        Inscribirme
      </button>
    </article>
  )
}

export default EventCard;