import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import EventCard from "./EventCard";

const mensajes409 = {
  INSCRIPCION_DUPLICADA: "Ya hay una inscripción con ese email.",
  EVENTO_SIN_CUPO: "El evento no tiene cupos disponibles.",
};

function mensajeDelServidor(data) {
  if (typeof data?.error === "string" && data.error) return data.error;
  if (typeof data?.mensaje === "string" && data.mensaje) return data.mensaje;
  if (typeof data?.resultado === "string" && mensajes409[data.resultado]) {
    return mensajes409[data.resultado];
  }
  if (typeof data?.resultado === "string" && data.resultado) return data.resultado;
  return "No se pudo completar la inscripción.";
}

function App() {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [seleccion, setSeleccion] = useState(null);
  const [campos, setCampos] = useState({
    nombre: "",
    email: "",
  });
  const [eventos, setEventos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const enviandoRef = useRef(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [errorInscripcion, setErrorInscripcion] = useState("");

  // Eventos de ejemplo localmente
  // const eventos = [
  //   {
  //     id: 1,
  //     nombre: "Introducción a la programación con React",
  //     descripcion:
  //       "En esta sesión aprenderás los conceptos básicos de React y cómo aplicarlos en tu vida diaria.",
  //     cupos: 10,
  //   },
  //   {
  //     id: 2,
  //     nombre: "Introducción a la programación con Node.js",
  //     descripcion:
  //       "En esta sesión aprenderás los conceptos básicos de Node.js y cómo aplicarlos en tu vida diaria.",
  //     cupos: 10,
  //   },
  //   {
  //     id: 3,
  //     nombre: "Introducción a la programación con Python",
  //     descripcion:
  //       "En esta sesión aprenderás los conceptos básicos de Python y cómo aplicarlos en tu vida diaria.",
  //     cupos: 0,
  //   },
  // ];

  const cargarEventos = useCallback(() => {
    const ruta = apiUrl + "/api/eventos";
    return fetch(ruta).then((response) => {
      if (!response.ok) {
        throw new Error("No se pudieron leer los eventos");
      }
      return response.json();
    }).then((data) => {
      setEventos(data);
    });
  }, [apiUrl]);

  useEffect(() => {
    cargarEventos().catch((error) => console.error("Error:", error));
  }, [cargarEventos]);

  useEffect(() => {
    if (!confirmacion && !errorInscripcion) return;
    const id = setTimeout(() => {
      setConfirmacion("");
      setErrorInscripcion("");
    }, 4000);
    return () => clearTimeout(id);
  }, [confirmacion, errorInscripcion]);

  const manejarInscripcion = async (e) => {
    e.preventDefault();
    if (enviandoRef.current || seleccion == null) return;

    enviandoRef.current = true;
    setEnviando(true);
    setConfirmacion("");
    setErrorInscripcion("");

    const ruta = apiUrl + "/api/eventos/" + seleccion + "/inscripciones";
    try {
      const response = await fetch(ruta, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: campos.nombre,
          email: campos.email,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 201) {
        setConfirmacion("Inscripción confirmada.");
        try {
          await cargarEventos();
        } catch (errorLectura) {
          console.error("Error:", errorLectura);
          await cargarEventos();
        } finally {
          setCampos({
            nombre: "",
            email: "",
          });
          setSeleccion(null);
        }
        return;
      }

      if (response.status === 409) {
        setErrorInscripcion(mensajeDelServidor(data));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  return (
    <main>
      <h1>EventHub</h1>
      {/* Eventos disponibles */}
      {eventos.map((evento) => (
        <Fragment key={evento.id}>
          <EventCard
            evento={evento}
            onSeleccion={() => {
              setSeleccion(evento.id);
              setConfirmacion("");
              setErrorInscripcion("");
            }}
          />
          {/* Formulario de inscripción */}
          {seleccion === evento.id && (
            <form className="inscripcion" onSubmit={manejarInscripcion}>
              <label>
                Nombre
                <input
                  type="text"
                  placeholder="Nombre"
                  required
                  value={campos.nombre}
                  onChange={(e) =>
                    setCampos({ ...campos, nombre: e.target.value })
                  }
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  required
                  value={campos.email}
                  onChange={(e) =>
                    setCampos({ ...campos, email: e.target.value })
                  }
                />
              </label>
              <button type="submit" disabled={enviando}>
                {enviando ? "Enviando…" : "Confirmar inscripción"}
              </button>
            </form>
          )}
        </Fragment>
      ))}
      {(errorInscripcion || confirmacion) && (
        <p
          className={`toast ${errorInscripcion ? "toast--error" : "toast--ok"}`}
          role={errorInscripcion ? "alert" : "status"}
        >
          {errorInscripcion || confirmacion}
        </p>
      )}
    </main>
  );
}

export default App;
