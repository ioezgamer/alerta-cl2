"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";

// --- Importaciones de Firebase (Asumiendo que tienes un archivo de configuración) ---
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
} from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  onSnapshot,
  serverTimestamp,
  orderBy,
  Timestamp,
} from "firebase/firestore";

// --- Tipos de Datos ---
type Report = {
  id: string;
  community: string;
  reporter: string;
  conditions: string[];
  intensity: "poca" | "moderada" | "mucha" | "fuerte";
  description: string;
  timestamp: Timestamp | null;
};

type Notification = {
  id: number;
  message: string;
  type: "success" | "error";
};

// --- Configuración de Firebase con variables de entorno (.env.local) ---
const appId = process.env.NEXT_PUBLIC_APP_ID || "default-app-id";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;
const initialAuthToken = process.env.NEXT_PUBLIC_INITIAL_AUTH_TOKEN || null;

let db: ReturnType<typeof getFirestore> | null = null;
const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig as any);
    db = getFirestore(app);
    const auth = getAuth(app);
    if (initialAuthToken) {
      signInWithCustomToken(auth, initialAuthToken).catch(() =>
        signInAnonymously(auth)
      );
    } else {
      signInAnonymously(auth);
    }
  } catch (e) {
    console.error("Error al inicializar Firebase:", e);
  }
}

// --- Componente Principal de la Aplicación ---
export default function AlertaClimaPage() {
  // --- Estados del Componente ---
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [formState, setFormState] = useState({
    community: "",
    reporter: "",
    conditions: new Set<string>(),
    intensity: "leve",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Efecto para cargar datos de Firebase ---
  useEffect(() => {
    if (!db) {
      console.error("Firestore no está inicializado.");
      setLoading(false);
      showNotification("Error de conexión con la base de datos.", "error");
      return;
    }

    const dbRef = db as Firestore;
    const reportsCollection = collection(
      dbRef,
      `/artifacts/${appId}/public/data/reports`
    );
    const q = query(reportsCollection, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedReports: Report[] = [];
        snapshot.forEach((doc) => {
          fetchedReports.push({ id: doc.id, ...doc.data() } as Report);
        });
        setReports(fetchedReports);
        setLoading(false);
      },
      (error) => {
        console.error("Error al obtener reportes: ", error);
        setLoading(false);
        showNotification("No se pudieron cargar los reportes.", "error");
      }
    );

    return () => unsubscribe(); // Limpiar el listener al desmontar el componente
  }, []);

  // --- Memoización para calcular estadísticas ---
  const stats = useMemo(() => {
    const totalReports = reports.length;
    const activeCommunities = new Set(reports.map((r) => r.community)).size;
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const activeAlerts = reports.filter((report) => {
      const reportTime = report.timestamp?.toDate().getTime() ?? 0;
      return (
        reportTime > oneHourAgo && !report.conditions.includes("despejado")
      );
    }).length;
    const lastUpdate =
      reports.length > 0 ? getTimeSince(reports[0].timestamp) : "-";

    return { totalReports, activeCommunities, activeAlerts, lastUpdate };
  }, [reports]);

  // --- Manejadores de Eventos ---
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormState((prevState) => {
      const newConditions = new Set(prevState.conditions);
      if (checked) {
        newConditions.add(value);
      } else {
        newConditions.delete(value);
      }
      return { ...prevState, conditions: newConditions };
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formState.community.trim() === "" || formState.conditions.size === 0) {
      showNotification(
        "Por favor, completa la comunidad y selecciona al menos una condición.",
        "error"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (!db) {
        showNotification("Firebase no está configurado.", "error");
        return;
      }
      const dbRef = db as Firestore;
      const reportsCollection = collection(
        dbRef,
        `/artifacts/${appId}/public/data/reports`
      );
      await addDoc(reportsCollection, {
        community: formState.community,
        reporter: formState.reporter || "Anónimo",
        conditions: Array.from(formState.conditions),
        intensity: formState.intensity,
        description: formState.description,
        timestamp: serverTimestamp(),
      });

      showNotification("¡Reporte enviado exitosamente! Gracias.", "success");
      // Reset form
      setFormState({
        community: "",
        reporter: "",
        conditions: new Set(),
        intensity: "leve",
        description: "",
      });
    } catch (error) {
      console.error("Error al enviar reporte:", error);
      showNotification("Hubo un error al enviar el reporte.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Funciones de Utilidad ---
  const showNotification = (message: string, type: "success" | "error") => {
    const newNotification = { id: Date.now(), message, type };
    setNotifications((prev) => [...prev, newNotification]);
    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((n) => n.id !== newNotification.id)
      );
    }, 5000);
  };

  const conditionEmojis: { [key: string]: string } = {
    lluvia: "🌧️ Lluvia",
    "lluvia-fuerte": "⛈️ Lluvia fuerte",
    viento: "💨 Vientos fuertes",
    inundacion: "🌊 Inundaciones",
    nublado: "☁️ Nublado",
    despejado: "☀️ Despejado",
  };

  function getTimeSince(firebaseTimestamp: Timestamp | null): string {
    if (!firebaseTimestamp || typeof firebaseTimestamp.toDate !== "function") {
      return "hace un momento";
    }
    const timestamp = firebaseTimestamp.toDate().getTime();
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days}d`;
    if (hours > 0) return `Hace ${hours}h`;
    if (minutes > 0) return `Hace ${minutes}m`;
    return "Ahora mismo";
  }

  function formatReportDate(firebaseTimestamp: Timestamp | null): string {
    if (!firebaseTimestamp || typeof firebaseTimestamp.toDate !== "function") {
      return "";
    }
    const d = firebaseTimestamp.toDate();
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // --- Renderizado del Componente ---
  return (
    <>
      <style>{`
                /* Estilos globales y de fondo */
                body {
                    box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0; padding: 0; background: linear-gradient(180deg, #ffffff 1%, #00c2cb 100%);
                    min-height: 100vh; color: #333;
                }
                /* Animación del indicador de estado */
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                /* Animación de entrada de elementos */
                @keyframes slideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                /* Animación de notificaciones */
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `}</style>

      {/* Contenedor de Notificaciones */}
      <div className="fixed top-5 right-5 z-50 space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-lg shadow-lg text-black font-semibold animate-slideInRight ${
              n.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>

      <div className="p-5 mx-auto max-w-7xl">
        {/* Encabezado */}
        <header className="mb-8 text-center text-black">
          <div className="flex gap-3 justify-center items-center mb-2">
            <Image
              src="/logo.png"
              alt="ACL2"
              width={64}
              height={64}
              priority
              className="rounded-full"
            />
            <h1 className="text-4xl font-bold">Alerta Clima Limón 2</h1>
          </div>
          <p className="mt-2 text-lg">
            Sistema Comunitario de Alertas Climáticas en Tiempo Real
          </p>
          <p className="mt-1">
            Reporta las condiciones del tiempo en tu comunidad y mantente
            informado
            <span
              className="inline-block ml-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"
              title="Sistema activo"
            ></span>
          </p>
        </header>

        {/* Contenido Principal */}
        <main className="grid grid-cols-1 gap-8 mb-8 lg:grid-cols-2">
          {/* Formulario de Reporte */}
          <div className="p-8 bg-white rounded-2xl shadow-2xl">
            <h2 className="flex gap-3 items-center mb-6 text-2xl font-bold text-gray-800">
              📍 Reportar Condiciones Climáticas
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="community"
                  className="block mb-2 font-semibold text-gray-600"
                >
                  Nombre de tu comunidad:
                </label>
                <input
                  type="text"
                  id="community"
                  name="community"
                  value={formState.community}
                  onChange={handleInputChange}
                  placeholder="Ej: Limón 2"
                  required
                  className="p-3 w-full text-black rounded-lg border-2 border-gray-200 transition focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="reporter"
                  className="block mb-2 font-semibold text-gray-600"
                >
                  Tu nombre (opcional):
                </label>
                <input
                  type="text"
                  id="reporter"
                  name="reporter"
                  value={formState.reporter}
                  onChange={handleInputChange}
                  placeholder="Nombre del reportero"
                  className="p-3 w-full text-black rounded-lg border-2 border-gray-200 transition focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-3 font-semibold text-gray-600">
                  ¿Qué condiciones climáticas observas?
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Object.entries(conditionEmojis).map(([value, label]) => (
                    <label
                      key={value}
                      className="flex gap-2 items-center p-3 text-black rounded-lg border-2 border-gray-200 transition cursor-pointer hover:bg-indigo-50 hover:border-indigo-400"
                    >
                      <input
                        type="checkbox"
                        value={value}
                        checked={formState.conditions.has(value)}
                        onChange={handleCheckboxChange}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="intensity"
                  className="block mb-2 font-semibold text-gray-600"
                >
                  Intensidad:
                </label>
                <input
                  type="text"
                  id="intensity"
                  name="intensity"
                  value={formState.intensity}
                  onChange={handleInputChange}
                  placeholder="Ej: moderada"
                  className="p-3 w-full text-black bg-white rounded-lg border-2 border-gray-200 transition focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block mb-2 font-semibold text-gray-600"
                >
                  Descripción adicional:
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formState.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe lo que observas..."
                  className="p-3 w-full text-black rounded-lg border-2 border-gray-200 transition focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="p-4 w-full text-lg font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
              >
                {isSubmitting ? "Enviando..." : "📤 Enviar Reporte"}
              </button>
            </form>
          </div>

          {/* Panel de Alertas */}
          <div className="p-8 bg-white rounded-2xl shadow-2xl">
            <h2 className="flex gap-3 items-center mb-6 text-2xl font-bold text-gray-800">
              🚨 Alertas en Tiempo Real
            </h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {loading ? (
                <p>Cargando reportes...</p>
              ) : reports.length === 0 ? (
                <p>No hay reportes. ¡Sé el primero!</p>
              ) : (
                reports.map((report, index) => (
                  <div
                    key={report.id}
                    className={`bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500 animate-slideIn ${
                      index === 0 && reports.length > 1
                        ? "bg-green-50 border-green-500"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800">
                          {report.community}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatReportDate(report.timestamp)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {getTimeSince(report.timestamp)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(report.conditions || []).map((c) => (
                        <span
                          key={c}
                          className="px-2 py-1 text-xs text-black bg-indigo-500 rounded-full"
                        >
                          {conditionEmojis[c]}
                        </span>
                      ))}
                      <span className="px-2 py-1 text-xs text-white bg-red-500 rounded-full">
                        Intensidad: {report.intensity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {report.description || "Sin descripción adicional"} -{" "}
                      <span className="font-semibold">
                        Reportado por: {report.reporter}
                      </span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>

        {/* Sección de Estadísticas */}
        <section className="p-6 bg-white rounded-2xl shadow-2xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {Object.entries({
              "Reportes Totales": stats.totalReports,
              "Comunidades Activas": stats.activeCommunities,
              "Alertas Activas": stats.activeAlerts,
              "Última Actualización": stats.lastUpdate,
            }).map(([label, value]) => (
              <div
                key={label}
                className="p-5 text-center text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg"
              >
                <div className="text-3xl font-bold">{value}</div>
                <div className="mt-1 text-sm opacity-90">{label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
