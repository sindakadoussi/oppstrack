export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ 
        margin: 0, 
        padding: 0, 
        width: "100%",
        minHeight: "100vh"
      }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}