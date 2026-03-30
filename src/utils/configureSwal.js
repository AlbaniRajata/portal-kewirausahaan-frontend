import Swal from "sweetalert2";

const poppins = "'Poppins', sans-serif";

if (!Swal.__pkkStyled) {
  const originalFire = Swal.fire.bind(Swal);

  Swal.fire = (...args) => {
    if (args.length !== 1 || typeof args[0] !== "object" || args[0] === null || Array.isArray(args[0])) {
      return originalFire(...args);
    }

    const options = args[0];
    const userDidOpen = options.didOpen;

    const mergedOptions = {
      background: options.background ?? "#fff",
      color: options.color ?? "#0a0a0a",
      confirmButtonColor: options.confirmButtonColor ?? "#0D59F2",
      ...options,
      didOpen: (popup) => {
        popup.style.borderRadius = "20px";
        popup.style.padding = "8px";
        popup.style.fontFamily = poppins;

        const titleEl = popup.querySelector(".swal2-title");
        if (titleEl) {
          titleEl.style.fontFamily = poppins;
          titleEl.style.fontWeight = "500";
        }

        const textEl = popup.querySelector(".swal2-html-container");
        if (textEl) {
          textEl.style.fontFamily = poppins;
          textEl.style.fontSize = "14px";
        }

        const confirmBtn = Swal.getConfirmButton();
        if (confirmBtn) {
          confirmBtn.style.fontFamily = poppins;
          confirmBtn.style.fontWeight = options.confirmButtonFontWeight || "500";
          confirmBtn.style.borderRadius = "14px";
          confirmBtn.style.padding = "10px 18px";
          confirmBtn.style.border = "none";
        }

        const cancelBtn = Swal.getCancelButton();
        if (cancelBtn) {
          cancelBtn.style.fontFamily = poppins;
          cancelBtn.style.fontWeight = "500";
          cancelBtn.style.borderRadius = "14px";
          cancelBtn.style.padding = "10px 18px";
          cancelBtn.style.border = "none";
        }

        userDidOpen?.(popup);
      },
    };

    return originalFire(mergedOptions);
  };

  Swal.__pkkStyled = true;
}

export default Swal;