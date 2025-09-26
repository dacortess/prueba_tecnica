import express from "express";
import mysql from "mysql2/promise";

const app = express();
const PORT = 3000;

// Manejo de JSON
app.use(express.json());

// Definimos la conexion con base de datos
const pool = mysql.createPool({
  host: "host",   
  user: "user",
  password: "password",
  database: "database",
});

// Listar todos los libros
app.get("/libros", async (req, res) => {
  try {

    // Query para obtener todos los libros
    const [rows] = await pool.query("SELECT * FROM libros");
    
    //Si la lista retornada es vacia => No hay libros en la base de datos
    if (rows.length === 0) {
      return res.status(404).json({ error: "Libros no encontrados" });
    }
    res.json(rows);

    //En caso de algun error en el proceso
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ocurrio un error en el proceso" });
  }
});

// Agregar un libro nuevo
app.post("/libros", async (req, res) => {
  const { titulo, categoria, cantidad, autor } = req.body;

  // Validada que se tengan todos los datos necesarios
  if (!titulo || !categoria || cantidad === undefined || !autor) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    //Revisar si el autor ya existe
    const [rows] = await pool.query("SELECT id_autor FROM autores WHERE autor = ?", [autor]);

    let autorId;

    // Obtener id del autor si ya existe
    if (rows.length > 0) {
      autorId = rows[0].id_autor;

    // Si no existe, agregarlo y obtener su id
    } else {
      const [resultAutor] = await pool.query(
        "INSERT INTO autores (autor) VALUES (?)",
        [autor]
      );
      autorId = resultAutor.insertId;
    }

    // Query para agregar un nuevo libro
    const [resultLibro] = await pool.query(
      `INSERT INTO libros (titulo, categoria, cantidad, id_autor)
       VALUES (?, ?, ?, ?)`,
      [titulo, categoria, cantidad, autorId]
    );

    // Formato de respuesta
    const nuevoLibro = {
      id_libro: resultLibro.insertId,
      titulo,
      categoria,
      cantidad,
      autor
    };

    res.status(201).json(nuevoLibro);

    // En caso de algun error en el proceso
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ocurrio un error en el proceso" });
  }
});

// Iniciar servidor
app.listen(PORT);
