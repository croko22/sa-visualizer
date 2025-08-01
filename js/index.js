var viewers = {}; // Object to hold all active MSABrowser instances

// All alignment files that are available for comparison
const alignmentFiles = [
  "NC_002018_NC_002019.aln",
  "NC_002017_NC_002022.aln",
  "NC_002210_NC_002211.aln",
  "NC_006311_NC_006312.aln",
  "NC_007370_NC_007371.aln",
  "NC_026424_NC_026425.aln",
  "NC_036617_NC_036618.aln",
  "NC_002020_NC_002021.aln",
  "NC_004906_NC_004908.aln",
  "NC_007357_NC_007358.aln",
  "NC_007372_NC_007373.aln",
  "NC_026426_NC_026427.aln",
  "NC_036619_NC_036620.aln",
  "NC_002023_NC_002016.aln",
  "NC_004907_NC_004905.aln",
  "NC_007359_NC_007360.aln",
  "NC_007374_NC_007375.aln",
  "NC_026432_NC_026433.aln",
  "NC_036621_NC_026431.aln",
  "NC_002204_NC_002207.aln",
  "NC_004909_NC_004910.aln",
  "NC_007362_NC_007363.aln",
  "NC_007376_NC_007377.aln",
  "NC_026433_NC_026434.aln",
  "ON527433_ON527434.aln",
  "NC_002205_NC_002206.aln",
  "NC_004911_NC_004912.aln",
  "NC_007364_NC_006306.aln",
  "NC_007378_NC_007380.aln",
  "NC_026435_NC_026436.aln",
  "ON527531_ON527532.aln",
  "NC_002208_NC_002209.aln",
  "NC_006307_NC_006308.aln",
  "NC_007366_NC_007367.aln",
  "NC_007381_NC_007382.aln",
  "NC_026437_NC_026438.aln",
  "NC_006309_NC_006310.aln",
  "NC_007368_NC_007369.aln",
  "NC_026422_NC_026423.aln",
  "NC_036615_NC_036616.aln",
];

// Available models - all models use the same alignment files
const models = ["EdgeAlign", "MLP", "XGBoost", "NeedlemanWunsch"];

/**
 * Loads alignments for a given file from all available models.
 * @param {string} file - The name of the alignment file to load.
 */
function loadAllAlignments(file) {
  if (!file) return;
  const container = $("#alignments-container");
  container.empty(); // Clear previous results
  viewers = {}; // Reset the viewers object

  models.forEach((model) => {
    const filePath = `data/${model}/${file}`;

    // Create a placeholder card for each model
    const cardHtml = `
                <div id="card-for-${model}" class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-xl font-bold mb-4 text-gray-800">${model} Results</h3>
                    <div id="msa-viewer-${model}" class="msa-viewer-container">
                        <p class="text-gray-500 p-4">Cargando ${file} para el modelo ${model}...</p>
                    </div>
                    <div id="msa-report-${model}" class="mt-4"></div>
                </div>
            `;
    container.append(cardHtml);

    $.get(filePath, (fasta) => {
      // File found, render the alignment
      const viewerContainer = $(`#msa-viewer-${model}`);
      const reportContainer = $(`#msa-report-${model}`);

      viewerContainer.empty(); // Clear loading message

      var annotations = [];
      var alterations = [];

      viewers[model] = new MSABrowser({
        id: `msa-viewer-${model}`,
        msa: MSAProcessor({ fasta: fasta, hasConsensus: true }),
        annotations: annotations,
        alterations: alterations,
        colorSchema: "clustal2",
      });

      // Calculate and display the alignment score report
      const scorer = new AlignmentScorer();
      try {
        const sequences = scorer.parseFASTA(fasta);
        const stats = scorer.calculateMSAStats(sequences);
        const reportHTML = scorer.generateHTMLReport(stats);
        reportContainer.html(reportHTML);
      } catch (error) {
        console.error(`Error calculating score for ${model}:`, error);
        reportContainer.html(
          `<div class="p-4 text-red-800 bg-red-100 border border-red-300 rounded-lg"><p><strong>Error al calcular el puntaje:</strong> ${error.message}</p></div>`
        );
      }
    }).fail(function () {
      // File not found for this model
      const viewerContainer = $(`#msa-viewer-${model}`);
      viewerContainer.html(
        `<div class="p-4 text-center text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-lg"><p>Alineamiento no disponible para el modelo <strong>${model}</strong>.</p></div>`
      );
    });
  });
}

/**
 * Scrolls all available viewers to a specific position.
 */
function scrollToVariation() {
  Object.values(viewers).forEach((viewerInstance) => {
    if (
      viewerInstance &&
      typeof viewerInstance.scrollToPosition === "function"
    ) {
      viewerInstance.scrollToPosition(1, 5);
    }
  });
}

// Setup logic using jQuery's document ready event
$(document).ready(function () {
  const selectElement = $("#file-select");

  // Populate the select dropdown with all alignment files
  if (alignmentFiles.length > 0) {
    alignmentFiles.forEach((file) => {
      selectElement.append(`<option value="${file}">${file}</option>`);
    });

    // Add an event listener for changes
    selectElement.on("change", function () {
      const selectedFile = $(this).val();
      loadAllAlignments(selectedFile);
    });

    // Initial load for the first file in the list
    loadAllAlignments(alignmentFiles[0]);
  } else {
    selectElement.append(
      "<option>No hay archivos de alineamiento disponibles</option>"
    );
  }
});
