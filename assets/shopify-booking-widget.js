(function initBookingWidget() {
  const root = document.getElementById("booking-widget");

  if (!root) {
    return;
  }

  const apiBaseUrl = root.dataset.apiBaseUrl;
  const publicApiKey = root.dataset.publicApiKey;
  const form = document.getElementById("booking-form");
  const dateInput = document.getElementById("booking-date");
  const timeSelect = document.getElementById("booking-time");
  const statusElement = document.getElementById("booking-status");

  function setStatus(message, isError) {
    statusElement.textContent = message;
    statusElement.style.color = isError ? "#b42318" : "#1f6f5f";
  }

  async function request(path, options) {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-public-api-key": publicApiKey,
        ...(options && options.headers ? options.headers : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Ocurrio un error inesperado");
    }

    return data;
  }

  function renderSlots(slots) {
    timeSelect.innerHTML = "";

    if (!slots.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No hay horarios disponibles";
      timeSelect.appendChild(option);
      return;
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Selecciona una hora";
    timeSelect.appendChild(placeholder);

    slots.forEach((slot) => {
      const option = document.createElement("option");
      option.value = slot;
      option.textContent = slot;
      timeSelect.appendChild(option);
    });
  }

  async function loadAvailability() {
    const selectedDate = dateInput.value;

    if (!selectedDate) {
      renderSlots([]);
      return;
    }

    setStatus("Cargando horarios...", false);

    try {
      const result = await request(
        `/availability?date=${encodeURIComponent(selectedDate)}`
      );

      renderSlots(result.data.availableSlots || []);

      if (result.data.isClosed) {
        setStatus(result.data.message || "No hay horarios disponibles", true);
        return;
      }

      setStatus("Horarios cargados correctamente", false);
    } catch (error) {
      renderSlots([]);
      setStatus(error.message, true);
    }
  }

  dateInput.addEventListener("change", loadAvailability);

  form.addEventListener("submit", async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (!payload.appointmentDate || !payload.appointmentTime) {
      setStatus("Debes seleccionar fecha y hora", true);
      return;
    }

    setStatus("Enviando reserva...", false);

    try {
      const result = await request("/reserve", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      form.reset();
      renderSlots([]);
      setStatus(result.message || "Reserva creada correctamente", false);
    } catch (error) {
      setStatus(error.message, true);
    }
  });
})();
