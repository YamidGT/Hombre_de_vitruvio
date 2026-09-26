import type { ProportionResult } from "../measurement/types";

function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

function formatCm(cm: number): string {
  return `${cm.toFixed(1)} cm`;
}

function deviationLabel(actual: number, ideal: number): string {
  const deltaPct = (actual - ideal) * 100;
  const abs = Math.abs(deltaPct).toFixed(1);
  if (Math.abs(deltaPct) < 1) return `dentro de ${abs}%`;
  return deltaPct > 0 ? `${abs}% más grande que el ideal` : `${abs}% más chico que el ideal`;
}

export function renderResultsTable(container: HTMLElement, results: ProportionResult[]): void {
  container.innerHTML = "";

  if (results.length === 0) {
    const empty = document.createElement("p");
    empty.className = "results-empty";
    empty.textContent =
      "No se pudieron calcular medidas confiables — probá con una foto de cuerpo completo, de frente, con brazos y piernas bien extendidos.";
    container.appendChild(empty);
    return;
  }

  const showCm = results.some((r) => r.actualCm != null);

  const table = document.createElement("table");
  table.className = "results-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Medida</th>
      <th>Tu proporción</th>
      ${showCm ? "<th>Tu medida</th>" : ""}
      <th>Ideal de Vitrubio</th>
      <th>Diferencia</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const r of results) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${r.label}</td>
      <td>${formatPercent(r.actualRatio)}</td>
      ${showCm ? `<td>${r.actualCm != null ? formatCm(r.actualCm) : "—"}</td>` : ""}
      <td>${r.idealLabel} (${formatPercent(r.idealRatio)}${r.idealCm != null ? `, ${formatCm(r.idealCm)}` : ""})</td>
      <td>${deviationLabel(r.actualRatio, r.idealRatio)}</td>
    `;
    tbody.appendChild(row);
  }
  table.appendChild(tbody);

  container.appendChild(table);
}
