import type { ReactNode } from "react";

export interface SkillItem {
  icon: ReactNode;
  iconColor: string | null;
  label: string;
  tooltipTitle: string;
  tooltipBody: string;
}

/**
 * Specialty area data used in the landing page skills grid.
 * Icons are assigned in page.tsx where the SVG components are defined;
 * emoji icons are inlined here directly.
 */
export const SKILL_ITEMS: Omit<SkillItem, "icon">[] = [
  {
    iconColor: "#a78bfa",
    label: "Programación con Python, Java, C y Haskell",
    tooltipTitle: "Programación",
    tooltipBody:
      "Clases de programación imperativa, orientada a objetos y funcional. Estructuras de datos, algoritmos, parsers en Haskell, programación paralela con MPI. Para universidades, ciclos formativos y proyectos propios.",
  },
  {
    iconColor: "#6abf69",
    label: "Desarrollo backend con Spring Boot",
    tooltipTitle: "Desarrollo backend",
    tooltipBody:
      "Creación de APIs REST y microservicios con Spring Boot. Integración con bases de datos SQL y NoSQL, despliegue en la nube (AWS, Google Cloud) y flujos DevOps con Docker y Git.",
  },
  {
    iconColor: null,
    label: "Análisis de datos & Estadística",
    tooltipTitle: "Datos y estadística",
    tooltipBody:
      "Probabilidad, estadística aplicada, minería de datos y Big Data. Desde asignaturas universitarias de Ingeniería hasta proyectos de análisis con Python. También bases de datos SQL y NoSQL.",
  },
  {
    iconColor: null,
    label: "Matemáticas Computacionales",
    tooltipTitle: "Matemáticas aplicadas",
    tooltipBody:
      "Cálculo, álgebra lineal, métodos numéricos, matemática discreta y compiladores/autómatas.",
  },
  {
    iconColor: null,
    label: "Ciclos formativos DAM y DAW",
    tooltipTitle: "DAM y DAW",
    tooltipBody:
      "Apoyo integral para alumnos de grado superior: programación, bases de datos, sistemas operativos, desarrollo web y proyectos de fin de ciclo. Experiencia con alumnos de múltiples centros.",
  },
  {
    iconColor: null,
    label: "Inteligencia Artificial",
    tooltipTitle: "Inteligencia artificial",
    tooltipBody:
      "Machine Learning, Deep Learning con TensorFlow, agentes de IA y uso de MCP. También consultoría para empresas que quieren incorporar IA en sus procesos o productos.",
  },
];
