const LIMITATIONS = [
  "Es una medición 2D a partir de una sola foto: cualquier parte del cuerpo que no esté paralela a la cámara se ve distorsionada.",
  "El ángulo/lente de la cámara puede distorsionar proporciones (evitá gran angular o fotos muy de cerca).",
  "Ropa holgada puede desplazar la estimación de codos y muñecas.",
  "Si un pie o brazo está oculto o no bien extendido, esa medida se omite en vez de mostrarse mal.",
  "La altura de la cabeza es una estimación anthropométrica, no una medida exacta.",
];

export function renderLimitationsNotice(container: HTMLElement): void {
  const details = document.createElement("details");
  details.className = "limitations";

  const summary = document.createElement("summary");
  summary.textContent = "¿Qué tan preciso es este software?";
  details.appendChild(summary);

  const list = document.createElement("ul");
  for (const item of LIMITATIONS) {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  }
  details.appendChild(list);

  container.appendChild(details);
}
