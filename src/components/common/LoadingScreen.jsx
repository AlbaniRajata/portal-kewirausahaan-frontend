import { Box, Typography } from "@mui/material";

export default function LoadingScreen({
  message = "Memuat...",
  overlay = false,
  minHeight = "100vh",
}) {
  return (
    <Box
      sx={{
        position: overlay ? "absolute" : "relative",
        inset: overlay ? 0 : "auto",
        minHeight,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        backgroundColor: overlay ? "rgba(255, 255, 255, 0.28)" : "#f9fafb",
        backdropFilter: overlay ? "blur(6px)" : "none",
        WebkitBackdropFilter: overlay ? "blur(6px)" : "none",
        borderRadius: overlay ? "16px" : 0,
        zIndex: overlay ? 10 : 1,
        "@keyframes orbitSpin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "@keyframes coreSpin": {
          from: { transform: "translate(-50%, -50%) rotate(0deg)" },
          to: { transform: "translate(-50%, -50%) rotate(360deg)" },
        },
        "@keyframes pulseCore": {
          "0%": { transform: "scale(0.92)", opacity: 0.65 },
          "50%": { transform: "scale(1)", opacity: 1 },
          "100%": { transform: "scale(0.92)", opacity: 0.65 },
        },
      }}
    >
      <Box sx={{ position: "relative", width: 78, height: 78 }}>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid rgba(13, 89, 242, 0.22)",
            borderTopColor: "#0D59F2",
            animation: "orbitSpin 1.1s linear infinite",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 34,
            height: 34,
            transform: "translate(-50%, -50%)",
            animation: "coreSpin 1.2s linear infinite",
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "radial-gradient(circle at 30% 30%, #4c8aff, #0D59F2)",
              boxShadow: "0 8px 22px rgba(13,89,242,0.35)",
              animation: "pulseCore 1.4s ease-in-out infinite",
            }}
          />
        </Box>
      </Box>

      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#35507c", textAlign: "center" }}>
        {message}
      </Typography>
    </Box>
  );
}
