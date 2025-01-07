// Importar las dependencias necesarias
const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Middleware para manejar JSON
app.use(express.json());

// Middleware CORS personalizado
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Permitir solicitudes desde cualquier origen
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Métodos HTTP permitidos
    res.header('Access-Control-Allow-Headers', 'Content-Type'); // Encabezados permitidos
    next();
});
// Archivo que actúa como "base de datos"
const DB_FILE = 'race_data.json';

// Función para leer y escribir en el archivo JSON
const readData = () => {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ races: [] }));
    }
    return JSON.parse(fs.readFileSync(DB_FILE));
};

const writeData = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Ruta para iniciar una nueva carrera (POST)
app.post('/races', (req, res) => {
    const { numCorredores, distancia } = req.body;
    if (!numCorredores || !distancia) {
        return res.status(400).json({ error: 'Número de corredores y distancia son requeridos.' });
    }

    const corredores = Array.from({ length: numCorredores }, (_, i) => ({
        id: i + 1,
        velocidad: Math.random() * 10 + 5, // Velocidad aleatoria entre 5 y 15 km/h
        posicion: 0,
    }));

    const race = {
        id: Date.now(),
        distancia,
        corredores,
        terminado: false,
        ganador: null,
    };

    const data = readData();
    data.races.push(race);
    writeData(data);

    res.status(201).json(race);
});

// Ruta para simular el avance de la carrera (PUT)
app.put('/races/simulate/:id', (req, res) => {
    const { id } = req.params;
    const data = readData();
    const race = data.races.find((r) => r.id == id);

    if (!race) {
        return res.status(404).json({ error: 'Carrera no encontrada.' });
    }

    if (race.terminado) {
        return res.status(400).json({ error: 'La carrera ya ha terminado.' });
    }

    let tiempo = 0;
    while (!race.terminado) {
        tiempo++;
        race.corredores.forEach((corredor) => {
            corredor.posicion += corredor.velocidad;
            if (corredor.posicion >= race.distancia) {
                race.terminado = true;
                race.ganador = corredor.id;
            }
        });
    }

    writeData(data);
    res.json({ tiempo, ganador: race.ganador, corredores: race.corredores });
});

// Ruta para obtener todas las carreras (GET)
app.get('/races/all', (req, res) => {
    const data = readData();
    res.json(data.races);
});

// Ruta para obtener una carrera específica (GET)
app.get('/races/:id', (req, res) => {
    const { id } = req.params;
    const data = readData();
    const race = data.races.find((r) => r.id == id);

    if (!race) {
        return res.status(404).json({ error: 'Carrera no encontrada.' });
    }

    res.json(race);
});

// Ruta para eliminar una carrera (DELETE)
// Ruta para eliminar una carrera (DELETE)
app.delete('/races/delete/:id', (req, res) => {
    const { id } = req.params;
    const data = readData();
    const index = data.races.findIndex((r) => r.id == id);

    if (index === -1) {
        return res.status(404).json({ error: 'Carrera no encontrada.' });
    }

    const [deletedRace] = data.races.splice(index, 1);
    writeData(data);

    res.status(200).json({ 
        message: `Carrera con ID ${deletedRace.id} eliminada exitosamente.`,
        deletedRace 
    });
});


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
