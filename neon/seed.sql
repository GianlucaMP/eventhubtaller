begin;

insert into eventhub.eventos (id, titulo, descripcion, fecha, modalidad, capacidad)
values
  (1, 'Introducción a React', 'Conocé los fundamentos de React y creá tus primeras aplicaciones.', '2026-11-20 15:00:00-03', 'Virtual', 1),
  (2, 'APIs con Node.js', 'Aprendé a crear APIs REST con Node.js, Express y buenas prácticas.', '2026-11-24 17:00:00-03', 'Virtual', 5),
  (3, 'Primeros pasos con PostgreSQL', 'Configurá, consultá y administrá bases de datos con PostgreSQL.', '2026-11-27 16:00:00-03', 'Presencial', 1)
on conflict (id) do nothing;

insert into eventhub.inscripciones (evento_id, nombre, email)
values (3, 'Participante de demostración', 'demo@example.com')
on conflict (evento_id, email) do nothing;

select setval(pg_get_serial_sequence('eventhub.eventos', 'id'), (select max(id) from eventhub.eventos));

commit;
