document.addEventListener("DOMContentLoaded", () => {
  const modelForm = document.getElementById("modelForm");
  const searchModel = document.getElementById("searchModel");
  const searchResults = document.getElementById("searchResults");
  const modelTable = document.getElementById("modelTable")?.getElementsByTagName("tbody")[0];
  const darkModeToggle = document.getElementById("darkModeToggle");
  const exportForm = document.getElementById("exportForm");
  const searchModelExport = document.getElementById("searchModelExport");
  const searchResultsExport = document.getElementById("searchResultsExport");
  const selectedModelsList = document.getElementById("selectedModelsList");
  const modelDetails = document.getElementById("modelDetails");
  const quantityInput = document.getElementById("quantity");
  const packagesInput = document.getElementById("packages");
  const pairsInput = document.getElementById("pairs");
  const addModelDetailsButton = document.getElementById("addModelDetails");

  let selectedModels = [];
  let selectedModel = null;

  // Fetch and display models
  if (modelTable) {
    fetchModels();
  }

  // Add a new model
  if (modelForm) {
    modelForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("modelName").value;
      const price = document.getElementById("modelPrice").value;

      fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price }),
      })
        .then(() => {
          modelForm.reset();
          alert("Model added successfully!");
          fetchModels(); // Refresh the model list
        })
        .catch((error) => {
          console.error("Error adding model:", error);
          alert("Failed to add model.");
        });
    });
  }

  // Search for a model on the export page
  if (searchModelExport) {
    searchModelExport.addEventListener("focus", () => {
      fetch(`/api/models`)
        .then((response) => response.json())
        .then((data) => {
          updateSearchResults(searchResultsExport, data);
        })
        .catch((error) => {
          console.error("Error fetching models:", error);
          searchResultsExport.innerHTML = "<div>Error fetching models.</div>";
        });
    });

    searchModelExport.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      fetch(`/api/models`)
        .then((response) => response.json())
        .then((data) => {
          const filteredModels = data.filter((model) =>
            model.name.toLowerCase().includes(searchTerm)
          );
          updateSearchResults(searchResultsExport, filteredModels);
        })
        .catch((error) => {
          console.error("Error searching models:", error);
          searchResultsExport.innerHTML = "<div>Error fetching search results.</div>";
        });
    });

    document.addEventListener("click", (e) => {
      if (!searchModelExport.contains(e.target) && !searchResultsExport.contains(e.target)) {
        searchResultsExport.innerHTML = "";
      }
    });
  }

  // Function to update search results
  function updateSearchResults(container, models) {
    container.innerHTML = models
      .map(
        (model) => `
          <div class="search-result" data-id="${model.id}" data-name="${model.name}" data-price="${model.price}" style="padding: 12px; border-bottom: 1px solid #ddd; cursor: pointer; transition: all 0.3s ease; background: ${document.body.classList.contains("dark-mode") ? "#444" : "#f9f9f9"};">
            <strong style="color: ${document.body.classList.contains("dark-mode") ? "#00e6ff" : "#3498db"};">${model.name}</strong>: <span class="currency" style="color: #27ae60;">${model.price} DH</span>
          </div>
        `
      )
      .join("");

    container.querySelectorAll(".search-result").forEach((result) => {
      result.addEventListener("click", (e) => {
        const modelDiv = e.target.closest(".search-result");
        const modelName = modelDiv.getAttribute("data-name");
        const modelPrice = modelDiv.getAttribute("data-price");

        searchModelExport.value = modelName;

        selectedModel = {
          id: modelDiv.getAttribute("data-id"),
          name: modelName,
          price: modelPrice,
        };

        searchResultsExport.innerHTML = "";
        modelDetails.style.display = "block";
      });

      result.addEventListener("mouseenter", () => {
        result.style.transform = "translateY(-2px)";
        result.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
      });

      result.addEventListener("mouseleave", () => {
        result.style.transform = "translateY(0)";
        result.style.boxShadow = "none";
      });
    });
  }

  // Add model details to the list
  if (addModelDetailsButton) {
    addModelDetailsButton.addEventListener("click", () => {
      const quantity = quantityInput.value;
      const packages = packagesInput.value;
      const pairs = pairsInput.value;

      if (!quantity || !packages || !pairs) {
        alert("Please fill in all fields.");
        return;
      }

      selectedModels.push({
        ...selectedModel,
        quantity,
        packages,
        pairs,
      });

      quantityInput.value = "";
      packagesInput.value = "";
      pairsInput.value = "";

      modelDetails.style.display = "none";
      searchModelExport.value = "";

      updateSelectedModelsList();
    });
  }

  // Update selected models list
  function updateSelectedModelsList() {
    selectedModelsList.innerHTML = selectedModels
      .map(
        (model) => `
          <div class="selected-model" style="padding: 12px; margin-bottom: 10px; border: 1px solid ${document.body.classList.contains("dark-mode") ? "#555" : "#ddd"}; border-radius: 8px; background: ${document.body.classList.contains("dark-mode") ? "#444" : "#fff"}; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s ease;">
            <div>
              <strong style="color: ${document.body.classList.contains("dark-mode") ? "#00e6ff" : "#3498db"};">${model.name}</strong>:
              <span style="color: ${document.body.classList.contains("dark-mode") ? "#e0e0e0" : "#555"};">Quantity: ${model.quantity}</span>,
              <span style="color: ${document.body.classList.contains("dark-mode") ? "#e0e0e0" : "#555"};">Packages: ${model.packages}</span>,
              <span style="color: ${document.body.classList.contains("dark-mode") ? "#e0e0e0" : "#555"};">Pairs: ${model.pairs}</span>
            </div>
            <button class="remove-model" data-id="${model.id}" style="padding: 6px 12px; background: #e74c3c; color: #fff; border: none; border-radius: 6px; cursor: pointer; transition: all 0.3s ease;">Remove</button>
          </div>
        `
      )
      .join("");

    document.querySelectorAll(".remove-model").forEach((button) => {
      button.addEventListener("click", (e) => {
        const modelId = e.target.getAttribute("data-id");
        selectedModels = selectedModels.filter((model) => model.id !== modelId);
        updateSelectedModelsList();
      });
    });
  }

  // Export models to PDF from the export page
  if (exportForm) {
    exportForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const vendorName = document.getElementById("vendorName").value;

      if (!vendorName || selectedModels.length === 0) {
        alert("Please fill in the Vendor Name and add at least one model.");
        return;
      }

      generatePDF(selectedModels, vendorName);
    });
  }

  // Function to generate PDF with vendor information and selected models
  function generatePDF(selectedModels, vendorName) {
    const docDefinition = {
      content: [
        { text: `Vendor Name: ${vendorName}`, style: "header" },
        { text: "\n\n" },
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto"],
            body: [
              ["Model", "Price", "Quantity", "Packages", "Pairs", "Total", "Created At"],
              ...selectedModels.map((model) => [
                model.name,
                `${model.price} DH`,
                model.quantity,
                model.packages,
                model.pairs,
                `${model.quantity * model.price} DH`,
                new Date(model.created_at).toLocaleString(), // Format created_at for PDF
              ]),
            ],
          },
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: "left",
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 14,
          bold: true,
          alignment: "left",
          margin: [0, 0, 0, 10],
        },
      },
    };

    // Generate and open the PDF
    pdfMake.createPdf(docDefinition).open();
  }

  // Dark Mode Toggle
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      if (document.body.classList.contains("dark-mode")) {
        darkModeToggle.textContent = "☀️";
        localStorage.setItem("darkMode", "enabled");
      } else {
        darkModeToggle.textContent = "🌙";
        localStorage.setItem("darkMode", "disabled");
      }
      updateStylesForDarkMode();
    });

    if (localStorage.getItem("darkMode") === "enabled") {
      document.body.classList.add("dark-mode");
      darkModeToggle.textContent = "☀️";
      updateStylesForDarkMode();
    }
  }

  // Function to update styles for dark mode
  function updateStylesForDarkMode() {
    const isDarkMode = document.body.classList.contains("dark-mode");

    document.querySelectorAll("#searchResults div, #searchResultsExport div").forEach((div) => {
      div.style.background = isDarkMode ? "#444" : "#f9f9f9";
      div.querySelector("strong").style.color = isDarkMode ? "#00e6ff" : "#3498db";
    });

    document.querySelectorAll(".selected-model").forEach((div) => {
      div.style.background = isDarkMode ? "#444" : "#fff";
      div.style.borderColor = isDarkMode ? "#555" : "#ddd";
      div.querySelector("strong").style.color = isDarkMode ? "#00e6ff" : "#3498db";
      div.querySelectorAll("span").forEach((span) => {
        span.style.color = isDarkMode ? "#e0e0e0" : "#555";
      });
    });
  }

  // Fetch models from the server
  function fetchModels() {
    fetch("/api/models")
      .then((response) => response.json())
      .then((data) => {
        modelTable.innerHTML = "";
        data.forEach((model) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${model.id}</td>
            <td>${model.name}</td>
            <td><span class="currency">${model.price} DH</span></td>
            <td>${new Date(model.created_at).toLocaleString()}</td> <!-- Format created_at -->
            <td class="actions">
              <button class="edit" data-id="${model.id}">Edit</button>
              <button class="delete" data-id="${model.id}">Delete</button>
            </td>
          `;
          modelTable.appendChild(row);
        });
        attachEventListeners();
      })
      .catch((error) => {
        console.error("Error fetching models:", error);
        alert("Failed to fetch models.");
      });
  }

  // Attach event listeners to Edit and Delete buttons
  function attachEventListeners() {
    document.querySelectorAll(".edit").forEach((button) => {
      button.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        editModel(id);
      });
    });

    document.querySelectorAll(".delete").forEach((button) => {
      button.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        deleteModel(id);
      });
    });
  }

  // Function to edit a model
  function editModel(id) {
    const newName = prompt("Enter the new model name:");
    const newPrice = prompt("Enter the new model price:");
    if (newName && newPrice) {
      fetch(`/api/models/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, price: newPrice }),
      })
        .then(() => {
          alert("Model updated successfully!");
          fetchModels();
        })
        .catch((error) => {
          console.error("Error updating model:", error);
          alert("Failed to update model.");
        });
    }
  }

  // Function to delete a model
  function deleteModel(id) {
    if (confirm("Are you sure you want to delete this model?")) {
      fetch(`/api/models/${id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(() => {
          alert("Model deleted successfully!");
          fetchModels();
        })
        .catch((error) => {
          console.error("Error deleting model:", error);
          alert("Failed to delete model.");
        });
    }
  }
});
