# 🌎 Emi Tours

Emi Tours es una plataforma web de turismo enfocada en Medellín, Colombia. 
El proyecto permite a los usuarios consultar información sobre diferentes 
lugares turísticos, conocer los servicios disponibles y realizar reservas 
de tours.

## 🎯 Objetivo del proyecto

El objetivo de Emi Tours es facilitar a turistas y visitantes el acceso a 
información sobre lugares turísticos de Medellín y permitir la gestión de 
reservas de una manera sencilla desde una plataforma web.

## 👥 Público objetivo

Emi Tours está dirigido principalmente a:

- Turistas que desean conocer Medellín.
- Personas interesadas en realizar tours y experiencias turísticas.
- Usuarios que desean consultar información de lugares turísticos.
- Administradores encargados de gestionar la información del sistema.

## ✨ Funcionalidades principales

### 👤 Usuarios

- Registro e inicio de sesión.
- Validación de los datos ingresados por el usuario.
- Gestión del perfil.
- Edición de información personal.
- Configuración del idioma de la plataforma.

### 📍 Lugares turísticos

- Visualización de lugares turísticos de Medellín.
- Información y descripción de cada lugar.
- Imágenes de los destinos.
- Consulta de información relacionada con los tours.

### 📅 Reservas

- Selección del lugar turístico.
- Selección de fecha y hora.
- Selección del número de personas.
- Selección del idioma del tour.
- Selección del método de pago.
- Consulta del estado de la reserva.

### 🤖 Asistente virtual

La plataforma cuenta con un asistente virtual que permite orientar 
a los usuarios y brindar información relacionada con los tours.

### 🔐 Panel administrativo

El sistema cuenta con un panel administrativo para gestionar 
diferentes elementos de la plataforma, entre ellos:

- Usuarios.
- Lugares turísticos.
- Guías.
- Reservas.
- Estados de las reservas.
- Reportes y consultas de información.

## 🛠️ Tecnologías utilizadas

### Frontend

- React
- Vite
- JavaScript
- HTML
- CSS
- Bootstrap
- Material UI
- Axios

### Backend

- Node.js
- Express

### Base de datos

- MySQL

### Control de versiones

- Git
- GitHub

### Despliegue

- Railway

## 🏗️ Arquitectura del proyecto

Emi Tours utiliza una arquitectura dividida en frontend, backend y 
base de datos.

```text
                    EMI TOURS
                        │
            ┌───────────┴───────────┐
            │                       │
        FRONTEND                 BACKEND
        React + Vite           Node.js + Express
            │                       │
            │       API             │
            └───────────┬───────────┘
                        │
                     MySQL
                    Base de datos

Ejecutar el frontend = npm run dev      
Ejecutar el backend = node index.js               