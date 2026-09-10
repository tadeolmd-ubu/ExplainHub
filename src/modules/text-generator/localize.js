const labels = {
  "PROJECT OVERVIEW": "RESUMEN DEL PROYECTO", "PROJECT STATISTICS": "ESTADÍSTICAS DEL PROYECTO",
  "DEPENDENCY MAP": "MAPA DE DEPENDENCIAS", "API ENDPOINTS": "ENDPOINTS DE API",
  "ALTER MAP": "MAPA DE ALTERACIONES", "DML STATEMENTS": "SENTENCIAS DML",
  TABLES: "TABLAS", VIEWS: "VISTAS", INDEXES: "ÍNDICES", ROUTINES: "RUTINAS",
  TRIGGERS: "DISPARADORES", DROPS: "ELIMINACIONES", COMMENTS: "COMENTARIOS",
  Overview: "Resumen", "Project Structure": "Estructura del proyecto", "Project Info": "Información del proyecto",
  "Get Started": "Primeros pasos", Dependencies: "Dependencias", Features: "Características", Modules: "Módulos",
  "Database Schema": "Esquema de base de datos", "File Structure": "Estructura de archivos", "SQL Objects": "Objetos SQL",
  "CSS Variables": "Variables CSS", Technologies: "Tecnologías", "Entry points": "Puntos de entrada",
  "Files analyzed": "Archivos analizados", Imports: "Importaciones", Exports: "Exportaciones", Functions: "Funciones",
  Classes: "Clases", Routes: "Rutas", Tables: "Tablas", Views: "Vistas", Indexes: "Índices",
  Procedures: "Procedimientos", Triggers: "Disparadores", Databases: "Bases de datos", Inserts: "Inserciones",
  Updates: "Actualizaciones", Deletes: "Eliminaciones", Selects: "Consultas", "Alter Tables": "Alteraciones de tablas",
  Drops: "Eliminaciones", Comments: "Comentarios", Name: "Nombre", Kind: "Clase", Async: "Asíncrona", File: "Archivo",
  Purpose: "Propósito", Extends: "Hereda de", Method: "Método", Path: "Ruta", Table: "Tabla", Columns: "Columnas",
  Technology: "Tecnología", Module: "Módulo", Files: "Archivos", Description: "Descripción", Field: "Campo",
  Value: "Valor", Version: "Versión", Type: "Tipo", Details: "Detalles", Feature: "Característica", Implies: "Implica",
  "No verified startup command detected.": "No se detectó un comando de arranque verificable.",
  "Run from the project root:": "Ejecutar desde la raíz del proyecto:",
  "No declarations detected": "No se detectaron declaraciones",
};
const totals = { imports: "importaciones", exports: "exportaciones", functions: "funciones", classes: "clases", routes: "rutas", tables: "tablas", views: "vistas", indexes: "índices", "stored procedures": "procedimientos almacenados", triggers: "disparadores", databases: "bases de datos", inserts: "inserciones", updates: "actualizaciones", deletes: "eliminaciones", selects: "consultas", "alter tables": "alteraciones de tablas", drops: "eliminaciones", comments: "comentarios" };

// Localize presentation labels only: never translate identifiers, code or source text.
export function localizeReport(text, language, format = "txt") {
  if (language !== "es") return text;
  const lines = text.split("\n");
  let fenced = false;
  return lines.map((line, index) => {
    if (line.startsWith("```")) { fenced = !fenced; return line; }
    if (fenced) return line;
    if (format === "md") {
      if (line.startsWith("# Module:")) return line.replace("# Module:", "# Módulo:");
      const heading = line.match(/^(#{2,3}) (.+)$/);
      if (heading) return `${heading[1]} ${labels[heading[2]] || heading[2]}`;
      if (line.startsWith("|") && /^\|[-: |]+\|$/.test(lines[index + 1] || "")) {
        return line.split("|").map(cell => cell.trim() in labels ? ` ${labels[cell.trim()]} ` : cell).join("|");
      }
      return labels[line] || line;
    }
    if (labels[line]) return labels[line];
    const label = line.match(/^([^:]+):/);
    if (!label) return line;
    if (label[1].startsWith("Total ")) {
      const key = label[1].slice(6);
      if (totals[key]) return line.replace(label[1], `Total de ${totals[key]}`);
    }
    return labels[label[1]] ? line.replace(label[1], labels[label[1]]) : line;
  }).join("\n");
}
