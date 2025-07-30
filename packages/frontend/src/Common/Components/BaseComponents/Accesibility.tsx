  import React, { useRef, useState, useEffect } from "react";
  import { useTheme } from "../themeConfig";
  import { Button } from "./Button";
  import { Eclipse, Keyboard, Languages, X, Globe, Volume2, VolumeX } from "lucide-react";
  import { useScreenReader } from "../useScreenReader";

  export const Accesibility: React.FC = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const { theme, setTheme } = useTheme();
    const { isScreenReaderMode, toggleScreenReaderMode } = useScreenReader();
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (isOpen && dialogRef.current) {
        dialogRef.current.focus();
      }
    }, [isOpen]);

    const toggleHighContrast = (): void =>
      setTheme((prev) => {
        const isHighContrast: boolean = !prev.isHighContrast;
        return {
          ...prev,
          isHighContrast,
          colors: isHighContrast
            ? {
                ...prev.colors,
                primary: "#FFFFFF",
                background: "#000000",
                text: "#FFFFFF",
              }
            : {
                ...prev.colors,
                primary: "#007BFF",
                background: "#FFFFFF",
                text: "#000000",
              },
        };
      });

    const toggleKeyboardNavigation = (): void =>
      setTheme((prev) => ({ ...prev, isKeyboardNavigation: !prev.isKeyboardNavigation }));

    const setLanguage = (lang: "he" | "en"): void =>
      setTheme((prev) => ({ ...prev, lang, direction: lang === "he" ? "rtl" : "ltr" }));

    return (
      <>
        <Button
          aria-label="Accesibility Options"
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-4 right-4 p-4 rounded-full shadow-lg focus:outline-none focus:ring-2"
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.text,
          }}
        >
          ♿
        </Button>

        {isOpen && (
          <div
            role="dialog"
            ref={dialogRef}
            tabIndex={-1}
            aria-labelledby="a11y-dialog-title"
            className="fixed top-16 right-0 h-auto w-56 bg-white rounded-l-lg p-4 shadow-lg flex flex-col space-y-3 z-50"
            style={{
              fontFamily: theme.lang === "he" ? "Noto Sans Hebrew" : "Inter",
              direction: theme.direction,
              color: theme.colors.text,
            }}
          >
            <h2 id="a11y-dialog-title" className="text-lg font-bold mb-3">
              Accesibility Options
            </h2>

            {/* כפתור קראת האתר */}
            <Button
              className="bg-gray-100 rounded p-2 hover:bg-gray-200 transition flex items-center justify-center"
              onClick={toggleScreenReaderMode}
              title={isScreenReaderMode ? "בטל קראת האתר" : "הפעל קראת האתר"}
              aria-label={isScreenReaderMode ? "בטל קראת האתר" : "הפעל קראת האתר"}
              aria-pressed={isScreenReaderMode}
            >
              {theme.lang === "he" ? "קראת האתר" : "Screen Reader"}
              {isScreenReaderMode ? (
                <Volume2 size={20} />
              ) : (
                <VolumeX size={20} />
              )}
            </Button>

            <Button
              className="bg-gray-100 rounded p-2 hover:bg-gray-200 transition flex items-center justify-center"
              onClick={toggleHighContrast}
              title={theme.isHighContrast ? "Desactivar alto contraste" : "Activar alto contraste"}
              aria-label={theme.isHighContrast ? "Desactivar alto contraste" : "Activar alto contraste"}
            > Hight Contrast
              <Eclipse size={20} />
            </Button>


            <Button
              className="bg-gray-100 rounded p-2 hover:bg-gray-200 transition flex items-center justify-center"
              onClick={toggleKeyboardNavigation}
              title={theme.isKeyboardNavigation ? "Desactivar navegación por teclado" : "Activar navegación por teclado"}
              aria-label={theme.isKeyboardNavigation ? "Desactivar navegación por teclado" : "Activar navegación por teclado"}
            > Keyboard Navigation
              <Keyboard size={20} />
            </Button>

            <Button
              className="bg-gray-100 rounded p-2 hover:bg-gray-200 transition flex items-center justify-center"
              onClick={() => setLanguage("he")}
              title="Cambiar a Hebreo"
              aria-label="Cambiar a Hebreo"
            > Change to Hebrew 
              <Languages size={20} />
            </Button>

            <Button
              className="bg-gray-100 rounded p-2 hover:bg-gray-200 transition flex items-center justify-center"
              onClick={() => setLanguage("en")}
              title="Cambiar a Inglés"
              aria-label="Cambiar a Inglés"
            > Change to English 
              <Globe size={20} />
            </Button>

            <Button
              className="bg-red-500 text-white rounded p-2 hover:bg-red-600 transition mt-2 flex items-center justify-center"
              onClick={() => setIsOpen(false)}
              title="Cerrar"
              aria-label="Cerrar"
            > Close 
              <X size={20} />
            </Button>
          </div> 
        )}

      </>
    );
  };