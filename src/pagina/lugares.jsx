
import "./lugares.css";

export default function lugares() {
  return (
    <div className="lugares-container">
      {/* PABLO ESCOBAR */}
      <div className="lugar-card">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlnxh8O5vDMUrQWb0J8T-WDK-yHu9q_DHWZg&s" alt="Pablo Escobar" />
        <div>
          <h2>Pablo Escobar</h2>
          <p>
            Usando dinero del narcotráfico y con sus aspiraciones políticas y
            criminales presentes, Pablo Escobar decidió ofrecer "casas gratis"
            a sin-techos y los más pobres de Medellín al ordenar la
            construcción inicial de 250 casas para familias que vivían en el
            basurero municipal. El Gobierno Nacional ordenó demolerlas al saber
            que provenían del narcotráfico.
          </p>
        </div>
      </div>

      {/* COMUNA 13 */}
      <div className="lugar-card">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJFj3Gneuspnt1RUvzE8zelO98GAvkhGw1sg&s" alt="Comuna 13" />
        <div>
          <h2>Comuna 13</h2>
          <p>
            La Comuna 13 es un ejemplo emblemático de transformación social,
            arte urbano, cultura y comunidad. Graffitis, escaleras eléctricas y
            música hacen del lugar un símbolo de resiliencia y turismo.
          </p>
        </div>
      </div>

      {/* GUATAPÉ */}
      <div className="lugar-card">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9f2DxLn5Q8C_wFSmTg8iUxq1lQd6KlxbsAg&s" alt="Guatapé" />
        <div>
          <h2>Guatapé</h2>
          <p>
            Guatapé, conocido como "el pueblo de los zócalos", mezcla tradición
            indígena con modernidad. Con el embalse construido en los años 70,
            se convirtió en un destino turístico fundamental.
          </p>
        </div>
      </div>

      {/* PUEBLITO PAISA */}
      <div className="lugar-card">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSw4ZCUmpQS_mT3D5EqAIVMapoqLZ83EcSuA&s" alt="Pueblito Paisa" />
        <div>
          <h2>Pueblito Paisa</h2>
          <p>
            Réplica de un pueblo tradicional antioqueño, ubicado en el Cerro
            Nutibara. Es un sitio histórico y turístico que mezcla cultura,
            gastronomía y tradición.
          </p>
        </div>
      </div>

      {/* CITY TOUR */}
      <div className="lugar-card">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzZTpJR8aQt929h3wrN543y_gDCQxczoTRmA&s" alt="City Tour Medellín" />
        <div>
          <h2>City Tour</h2>
          <p>
            El centro de Medellín es un lugar lleno de historia, arte, comercio
            y cultura. Es un espacio donde se vive el ritmo auténtico de la
            ciudad.
          </p>
        </div>
      </div>

      {/* METRO CABLE */}
      <div className="lugar-card">
        <img src="https://getvico.com/blog/wp-content/uploads/2018/01/Metrocable.jpg" alt="Metro Cable" />
        <div>
          <h2>Metro Cable</h2>
          <p>
            La experiencia de montar en Metro Cable es única: permite ver la
            ciudad desde las alturas mientras asciendes por las montañas que
            rodean Medellín. Es tranquilo, panorámico y una de las mejores
            formas de entender cómo la movilidad transformó a la comunidad.
          </p>
        </div>
      </div>
    </div>
  );
}
