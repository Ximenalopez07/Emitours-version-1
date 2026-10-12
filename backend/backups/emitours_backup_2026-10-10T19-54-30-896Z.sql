-- COPIA DE SEGURIDAD BASE DE DATOS emitours
-- FECHA: 2026-10-10T19:54:30.898Z


-- --------------------------------------------------
-- Estructura y datos de la tabla `chatbot_config`
-- --------------------------------------------------

DROP TABLE IF EXISTS `chatbot_config`;
CREATE TABLE `chatbot_config` (
  `id` int NOT NULL DEFAULT '1',
  `activo` tinyint(1) DEFAULT '1',
  `mensaje_bienvenida` text,
  `faq` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `chatbot_config` VALUES
(1, 1, '¡Hola! Soy el Asistente Virtual IA de EmiTours. ¿En qué te puedo ayudar hoy?', NULL);


-- --------------------------------------------------
-- Estructura y datos de la tabla `chatbot_conversaciones`
-- --------------------------------------------------

DROP TABLE IF EXISTS `chatbot_conversaciones`;
CREATE TABLE `chatbot_conversaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `mensaje_usuario` text NOT NULL,
  `respuesta_ia` text NOT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `chatbot_conversaciones` VALUES
(1, 3, '¿Hay disponibilidad para Guatapé?', 'Actualmente para el **Guatapé** tenemos **20 cupos disponibles** (capacidad máx: 20 pers).
📌 **Precio:** $100.000 COP por persona.
⏰ **Horarios:** 4 Horas.
📍 **Ubicación:** Medellín.', '2026-08-24 23:02:14'),
(2, 3, '¿Cuáles son mis reservas?', 'Aquí tienes el historial de tus reservas registradas:

• **Pablo Escobar** | Código: `RES-8-5193` | Fecha: Wed Jul 22 | Hora: 10:44:00 | Pers: 1 | Estado: *Pendiente*', '2026-08-24 23:03:11'),
(3, 7, 'hay reservas para comuna 13?', '¡Hola! Soy tu Asistente Virtual EmiTours 🏔️. Puedo ayudarte a consultar:
1. 🌄 Disponibilidad y precios de nuestros tours en tiempo real.
2. 📅 El estado de tus reservas personales.
3. 💳 Métodos de pago y recomendaciones de viaje.

¿Sobre qué tema te gustaría consultar?', '2026-08-24 23:12:15'),
(4, 3, 'How to book a tour?', 'You can make your reservation from the **Reservations** section of EmiTours. There you can select the place, date, time, number of people, and payment method.', '2026-08-26 00:42:09'),
(5, 3, '¿Cuáles son los métodos de pago?', 'Aceptamos únicamente 4 métodos de pago:
1. 📱 Nequi
2. 🏦 PSE
3. 💵 Pago en efectivo
4. 💳 Datáfono

Puedes elegir la opción **Pagar ahora** o **Pagar después al finalizar el tour con la guía**.', '2026-08-26 00:42:29'),
(6, 5, 'que lugares hay', 'En EmiTours ofrecemos los siguientes tours principales:

• **Pablo Escobar** - $100.000 COP
• **Comuna 13** - $100.000 COP
• **Guatapé** - $100.000 COP
• **Pueblito Paisa** - $100.000 COP
• **City Tour** - $100.000 COP
• **Metro Cable** - $100.000 COP

¡Puedes consultarme la disponibilidad o precio de cualquier tour específico!', '2026-08-26 01:36:01'),
(7, 5, 'hay disponibilidad en metro cable??', 'Actualmente para el **Metro Cable** quedan **20 reservas disponibles** (Máximo 20 reservas por fecha).
📌 **Precio:** $100.000 COP por persona.
⏰ **Horario permitido:** 07:00 AM a 07:00 PM.', '2026-08-26 01:36:37'),
(8, 7, 'que horarios hay?', 'En EmiTours ofrecemos los siguientes tours principales:

• **Pablo Escobar** - $100.000 COP
• **Comuna 13** - $100.000 COP
• **Guatapé** - $100.000 COP
• **Pueblito Paisa** - $100.000 COP
• **City Tour** - $100.000 COP
• **Metro Cable** - $100.000 COP

¡Puedes consultarme la disponibilidad o precio de cualquier tour específico!', '2026-08-26 01:39:57'),
(9, 7, 'cuales son los horarios en el que puedo reservar', 'En EmiTours ofrecemos los siguientes tours principales:

• **Pablo Escobar** - $100.000 COP
• **Comuna 13** - $100.000 COP
• **Guatapé** - $100.000 COP
• **Pueblito Paisa** - $100.000 COP
• **City Tour** - $100.000 COP
• **Metro Cable** - $100.000 COP

¡Puedes consultarme la disponibilidad o precio de cualquier tour específico!', '2026-08-26 01:40:40'),
(10, 7, '¿Cuáles son los métodos de pago?', 'Aceptamos únicamente 4 métodos de pago:
1. 📱 Nequi
2. 🏦 PSE
3. 💵 Pago en efectivo
4. 💳 Datáfono

Puedes elegir la opción **Pagar ahora** o **Pagar después al finalizar el tour con la guía**.', '2026-08-26 01:46:17'),
(11, 3, '¿Qué guías tienen?', 'No tengo información registrada sobre ese tema en este momento. Puedes comunicarte con EmiTours por WhatsApp para obtener más información.', '2026-08-26 01:50:43'),
(12, 3, '¿Tienen viajes en helicóptero?', 'No tengo información registrada sobre ese tema en este momento. Puedes comunicarte con EmiTours por WhatsApp para obtener más información.', '2026-08-26 01:50:43'),
(13, 3, 'Quiero reservar un tour', 'Claro 😊 Puedes realizar tu reserva desde la sección de **Reservas** de EmiTours. Allí podrás seleccionar el lugar, la fecha, la hora, la cantidad de personas y el método de pago.', '2026-08-26 01:50:43'),
(14, 3, '¿Qué guías tienen?', 'Nuestros guías turísticos oficiales registrados en EmiTours son:

• **Maria Fabiola** | Idioma: Español | Email: lopezmariafabiola93@gmail.com
• **Yulisa Andrea Henao** | Idioma: Español | Email: henaolopez.98@hotmail.com
• **Mariana Cano** | Idioma: Español | Email: mariana09@gmail.com
• **Gloria Cecilia Lopez** | Idioma: Español | Email: Cecilialopez110878@gmail.com', '2026-08-26 01:51:34'),
(15, 3, '¿Qué lugares tienen?', 'Aquí tienes los lugares y tours reales registrados en EmiTours:

• **Pablo Escobar** - $100.000 COP
• **Comuna 13** - $100.000 COP
• **Guatapé** - $100.000 COP
• **Pueblito Paisa** - $100.000 COP
• **City Tour** - $100.000 COP
• **Metro Cable** - $100.000 COP', '2026-08-26 01:51:34'),
(16, 3, '¿Tienen alquiler de submarinos?', 'No tengo información registrada sobre ese tema en este momento. Puedes comunicarte con EmiTours por WhatsApp para obtener más información.', '2026-08-26 01:51:34'),
(17, 3, 'What are the payment methods?', 'We accept only 4 payment methods:
• Nequi
• PSE
• Cash payment
• POS Terminal (Datáfono)

📌 **Payment option:** When making your reservation you can choose to pay now or pay later upon completing the tour with the guide.', '2026-08-26 01:51:34'),
(18, 7, 'que precio tiene comuna 13 por persona?', '📍 **Comuna 13**
📝 **Descripción:** La Comuna 13 es un ejemplo emblemático de transformación social, arte urbano, cultura y comunidad. Graffitis, escaleras eléctricas y música hacen del lugar un símbolo de resiliencia y turismo.
💰 **Precio:** $100.000 COP
⏱️ **Duración:** 4 Horas', '2026-08-26 01:56:06'),
(19, 7, 'hay reservas de comuna 13¡', 'No tengo información registrada sobre ese tema en este momento. Puedes comunicarte con EmiTours por WhatsApp para obtener más información.', '2026-08-26 04:33:31'),
(20, 7, 'lugares de reservas?', 'Aquí tienes los lugares y tours reales registrados en EmiTours:

• **Pablo Escobar** - $100.000 COP
• **Comuna 13** - $100.000 COP
• **Guatapé** - $100.000 COP
• **Pueblito Paisa** - $100.000 COP
• **City Tour** - $100.000 COP
• **Metro Cable** - $100.000 COP', '2026-08-26 04:35:54'),
(21, 7, 'nombre de las guias', 'Nuestros guías turísticos oficiales registrados en EmiTours son:

• **Maria Fabiola** | Idioma: Español | Email: lopezmariafabiola93@gmail.com
• **Yulisa Andrea Henao** | Idioma: Español | Email: henaolopez.98@hotmail.com
• **Mariana Cano** | Idioma: Español | Email: mariana09@gmail.com
• **Gloria Cecilia Lopez** | Idioma: Español | Email: Cecilialopez110878@gmail.com', '2026-08-26 04:36:18'),
(22, 24, 'tengo 100000 que tour me recomiedas', 'Actualmente los tours disponibles tienen precios superiores a $100.000 COP (el valor oficial por tour es de $150.000 COP). Puedes consultar los lugares disponibles y elegir el que prefieras.', '2026-09-16 01:21:47'),
(23, 36, 'lugares', 'No tengo información registrada sobre ese tema en este momento. Puedes consultar la sección de Reservas o comunicarte con nosotros por WhatsApp para más información.', '2026-10-05 12:48:06'),
(24, 36, 'lugares', 'No tengo información registrada sobre ese tema en este momento. Puedes consultar la sección de Reservas o comunicarte con nosotros por WhatsApp para más información.', '2026-10-10 19:20:10'),
(25, 36, 'cuales son los lugares?', 'No tengo información registrada sobre ese tema en este momento. Puedes consultar la sección de Reservas o comunicarte con nosotros por WhatsApp para más información.', '2026-10-10 19:28:10'),
(26, 36, '1. ¿Qué lugares y tours ofrecen?', 'Aquí tienes los tours y precios reales disponibles en EmiTours:

• **Pablo Escobar** - $150.000 COP por persona (Pago inicial 50%: $75.000 COP)
• **Comuna 13** - $100.000 COP por persona (Pago inicial 50%: $50.000 COP)
• **Guatapé** - $250.000 COP por persona (Pago inicial 50%: $125.000 COP)
• **Pueblito Paisa** - $75.000 COP por persona (Pago inicial 50%: $37.500 COP)
• **City Tour** - $90.000 COP por persona (Pago inicial 50%: $45.000 COP)
• **Metro Cable** - $80.000 COP por persona (Pago inicial 50%: $40.000 COP)

📌 Todos los tours cuentan con guía profesional en español o inglés y requieren el 50% de pago inicial al reservar.', '2026-10-10 19:46:23'),
(27, 36, '2. ¿Cuáles son los precios de los tours?', 'Aquí tienes los tours y precios reales disponibles en EmiTours:

• **Pablo Escobar** - $150.000 COP por persona (Pago inicial 50%: $75.000 COP)
• **Comuna 13** - $100.000 COP por persona (Pago inicial 50%: $50.000 COP)
• **Guatapé** - $250.000 COP por persona (Pago inicial 50%: $125.000 COP)
• **Pueblito Paisa** - $75.000 COP por persona (Pago inicial 50%: $37.500 COP)
• **City Tour** - $90.000 COP por persona (Pago inicial 50%: $45.000 COP)
• **Metro Cable** - $80.000 COP por persona (Pago inicial 50%: $40.000 COP)

📌 Todos los tours cuentan con guía profesional en español o inglés y requieren el 50% de pago inicial al reservar.', '2026-10-10 19:46:44'),
(28, 36, '9. ¿Qué tour me recomiendan según mi presupuesto?', 'Aquí tienes los tours y precios reales disponibles en EmiTours:

• **Pablo Escobar** - $150.000 COP por persona (Pago inicial 50%: $75.000 COP)
• **Comuna 13** - $100.000 COP por persona (Pago inicial 50%: $50.000 COP)
• **Guatapé** - $250.000 COP por persona (Pago inicial 50%: $125.000 COP)
• **Pueblito Paisa** - $75.000 COP por persona (Pago inicial 50%: $37.500 COP)
• **City Tour** - $90.000 COP por persona (Pago inicial 50%: $45.000 COP)
• **Metro Cable** - $80.000 COP por persona (Pago inicial 50%: $40.000 COP)

📌 Todos los tours cuentan con guía profesional en español o inglés y requieren el 50% de pago inicial al reservar.', '2026-10-10 19:46:53'),
(29, 36, '7. ¿Qué guías turísticos tienen?', 'Nuestros guías turísticos oficiales registrados en EmiTours son:

• **Maria Fabiola** | Idioma: Español | Email: lopezmariafabiola93@gmail.com
• **Yulisa Andrea Henao** | Idioma: Español | Email: henaolopez.98@hotmail.com
• **Mariana Cano** | Idioma: Español | Email: mariana09@gmail.com
• **Gloria Cecilia Lopez** | Idioma: Español | Email: Cecilialopez110878@gmail.com', '2026-10-10 19:47:12');


-- --------------------------------------------------
-- Estructura y datos de la tabla `guias`
-- --------------------------------------------------

DROP TABLE IF EXISTS `guias`;
CREATE TABLE `guias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `idioma` varchar(50) NOT NULL,
  `foto` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `guias` VALUES
(1, 'Maria', 'Fabiola', '3246362543', 'lopezmariafabiola93@gmail.com', 'Español', 'src/assets/fabiola.jpg'),
(2, 'Yulisa Andrea', 'Henao', '3103795375', 'henaolopez.98@hotmail.com', 'Español', 'src\\assets\\yulisa.jpg'),
(3, 'Mariana', 'Cano', '3023829845', 'mariana09@gmail.com', 'Español', 'src\\assets\\mariana.jpg'),
(4, 'Gloria Cecilia', 'Lopez', '3127850702', 'Cecilialopez110878@gmail.com', 'Español', 'src\\assets\\gloria.jpg');


-- --------------------------------------------------
-- Estructura y datos de la tabla `lugares`
-- --------------------------------------------------

DROP TABLE IF EXISTS `lugares`;
CREATE TABLE `lugares` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `imagen` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `lugares` VALUES
(1, 'Pablo Escobar', 'Usando dinero del narcotráfico y con sus aspiraciones políticas y criminales presentes, Pablo Escobar decidió ofrecer "casas gratis" a sin-techos y los más pobres de Medellín al ordenar la construcción inicial de 250 casas para familias que vivían en el basurero municipal. El Gobierno Nacional ordenó demolerlas al saber que provenían del narcotráfico.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlnxh8O5vDMUrQWb0J8T-WDK-yHu9q_DHWZg&s'),
(2, 'Comuna 13', 'La Comuna 13 es un ejemplo emblemático de transformación social, arte urbano, cultura y comunidad. Graffitis, escaleras eléctricas y música hacen del lugar un símbolo de resiliencia y turismo.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJFj3Gneuspnt1RUvzE8zelO98GAvkhGw1sg&s'),
(3, 'Guatapé', 'Guatapé, conocido como "el pueblo de los zócalos", mezcla tradición indígena con modernidad. Con el embalse construido en los años 70, se convirtió en un destino turístico fundamental.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9f2DxLn5Q8C_wFSmTg8iUxq1lQd6KlxbsAg&s'),
(4, 'Pueblito Paisa', 'Réplica de un pueblo tradicional antioqueño, ubicado en el Cerro Nutibara. Es un sitio histórico y turístico que mezcla cultura, gastronomía y tradición.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSw4ZCUmpQS_mT3D5EqAIVMapoqLZ83EcSuA&s'),
(5, 'City Tour', 'El centro de Medellín es un lugar lleno de historia, arte, comercio y cultura. Es un espacio donde se vive el ritmo auténtico de la ciudad.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzZTpJR8aQt929h3wrN543y_gDCQxczoTRmA&s'),
(6, 'Metro Cable', 'La experiencia de montar en Metro Cable es única: permite ver la ciudad desde las alturas mientras asciendes por las montañas que rodean Medellín. Es tranquilo, panorámico y una de las mejores formas de entender cómo la movilidad transformó a la comunidad. 13', 'https://getvico.com/blog/wp-content/uploads/2018/01/Metrocable.jpg');


-- --------------------------------------------------
-- Estructura y datos de la tabla `mensajes_contacto`
-- --------------------------------------------------

DROP TABLE IF EXISTS `mensajes_contacto`;
CREATE TABLE `mensajes_contacto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `nombre` varchar(150) NOT NULL,
  `asunto` varchar(200) NOT NULL,
  `mensaje` text NOT NULL,
  `estado` enum('Pendiente','Respondido') DEFAULT 'Pendiente',
  `respuesta_admin` text,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `mensajes_contacto` VALUES
(1, NULL, 'Prueba EmiTours', 'Consulta de Horarios', 'Hola, ¿a qué hora sale el tour de Guatapé?', 'Pendiente', NULL, '2026-08-24 23:02:04');


-- --------------------------------------------------
-- Estructura y datos de la tabla `registro_usuarios`
-- --------------------------------------------------

DROP TABLE IF EXISTS `registro_usuarios`;
CREATE TABLE `registro_usuarios` (
  `id_registro` int NOT NULL AUTO_INCREMENT,
  `nombre_usuario` varchar(100) NOT NULL,
  `edad` int DEFAULT '18',
  `cedula` varchar(50) DEFAULT NULL,
  `correo_electronico` varchar(150) NOT NULL,
  `contrasena` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `foto` text,
  `rol` enum('usuario','admin') DEFAULT 'usuario',
  `pais` varchar(100) NOT NULL DEFAULT 'Colombia',
  `tipo_documento` varchar(50) NOT NULL DEFAULT 'Cédula de ciudadanía',
  `email_verificado` tinyint(1) NOT NULL DEFAULT '1',
  `codigo_recuperacion` varchar(10) DEFAULT NULL,
  `codigo_recuperacion_expira` datetime DEFAULT NULL,
  `google_id` varchar(100) DEFAULT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_registro`),
  UNIQUE KEY `correo_electronico` (`correo_electronico`),
  UNIQUE KEY `idx_pais_tipo_cedula` (`pais`,`tipo_documento`,`cedula`),
  UNIQUE KEY `google_id` (`google_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `registro_usuarios` VALUES
(1, 'helen', 18, '1087998487', 'helenhenao8@gmail.com', 'helen01234*', '3018694485', 'https://tse3.mm.bing.net/th/id/OIP.JItmblC0j7Wa-HCPgP16ngHaFB?pid=Api&P=0&h=180', 'admin', 'Colombia', 'Cédula de ciudadanía', 1, NULL, NULL, '112599815333701220090', '2026-10-05 06:26:32'),
(3, 'ximena', 28, '1223456784', 'ximena@gmail.com', 'Ximena07*', NULL, NULL, 'admin', 'Colombia', 'Cédula de ciudadanía', 1, NULL, NULL, NULL, '2026-10-05 06:26:32'),
(12, 'Administrador', 30, '10000000', 'admin@emitours.com', 'Admin123*', NULL, NULL, 'admin', 'Colombia', 'Cédula de ciudadanía', 1, NULL, NULL, NULL, '2026-10-05 06:26:32'),
(35, 'Ximena Henao', 18, '1087998483', 'ximenahena28@gmail.com', NULL, '+573018794480', 'https://lh3.googleusercontent.com/a/ACg8ocLaviOUp6rL1PHXC5dIHp213dU6vLsbc3-b029miPigtIrBHw=s96-c', 'usuario', 'Colombia', 'Cédula de ciudadanía', 1, NULL, NULL, '106750008331122811892', '2026-10-05 06:26:32'),
(36, 'Fabio lopez', 18, '43169103', 'flabiolalopez06@gmail.com', NULL, '+573018794445', 'https://lh3.googleusercontent.com/a/ACg8ocKGEGdlT5bGDFkyp3fvpvDmfOrirJI4CdEl6xiasIxe1zybzg=s96-c', 'usuario', 'Colombia', 'Cédula de ciudadanía', 1, NULL, NULL, '100099109434100991249', '2026-10-05 06:26:32'),
(37, 'Ximena lopez', 18, '1087998654', 'ximenahenao08@gmail.com', NULL, '+573045567785', 'https://lh3.googleusercontent.com/a/ACg8ocLOFSL8IPDElet4hs5ir4KE9G_sAGVTl9zSoIzb4Wa3FPw_Pw=s96-c', 'usuario', 'Colombia', 'Cédula de ciudadanía', 1, NULL, NULL, '117959586919444520938', '2026-10-05 06:26:32');


-- --------------------------------------------------
-- Estructura y datos de la tabla `reservas`
-- --------------------------------------------------

DROP TABLE IF EXISTS `reservas`;
CREATE TABLE `reservas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `lugar_id` int NOT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `numero_personas` int NOT NULL,
  `idioma` enum('es','en') NOT NULL,
  `precio_total` decimal(10,2) NOT NULL,
  `metodo_pago` enum('nequi','pse','efectivo','datafono') NOT NULL,
  `estado_pago` enum('pendiente','parcial','pagado') NOT NULL DEFAULT 'pendiente',
  `estado` enum('pendiente','confirmada','realizada','cancelada') DEFAULT 'pendiente',
  `codigo` varchar(30) NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_reservas_usuario` (`usuario_id`),
  KEY `fk_reservas_lugar` (`lugar_id`),
  CONSTRAINT `fk_reservas_lugar` FOREIGN KEY (`lugar_id`) REFERENCES `lugares` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reservas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `registro_usuarios` (`id_registro`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `reservas` VALUES
(26, 35, 3, '2026-10-08 05:00:00', '07:00:00', 1, 'es', '250000.00', 'nequi', 'pagado', 'pendiente', 'RES-759000', '2026-10-05 05:06:14'),
(27, 35, 2, '2026-10-14 05:00:00', '11:30:00', 1, 'es', '100000.00', 'nequi', 'pagado', 'pendiente', 'RES-781600', '2026-10-05 05:08:01'),
(28, 36, 2, '2026-10-07 05:00:00', '07:00:00', 2, 'en', '200000.00', 'nequi', 'pagado', 'pendiente', 'RES-376379', '2026-10-05 12:47:27');

