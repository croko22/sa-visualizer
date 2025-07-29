/**
 * Alignment Scorer - Calculates alignment quality metrics
 * For DNA sequence alignments
 */

class AlignmentScorer {
  constructor() {
    // Default scoring parameters for DNA
    this.matchScore = 2;
    this.mismatchScore = -1;
    this.gapPenalty = -2;
    this.gapExtensionPenalty = -0.5;
  }

  /**
   * Parse FASTA format alignment to extract sequences
   * @param {string} fastaContent - Raw FASTA content
   * @returns {Array} Array of {id, sequence} objects
   */
  parseFASTA(fastaContent) {
    const sequences = [];
    const lines = fastaContent.split("\n");
    let currentSeq = null;

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith(">")) {
        if (currentSeq) {
          sequences.push(currentSeq);
        }
        currentSeq = {
          id: line.substring(1),
          sequence: "",
        };
      } else if (line && currentSeq) {
        currentSeq.sequence += line;
      }
    }

    if (currentSeq) {
      sequences.push(currentSeq);
    }

    return sequences;
  }

  /**
   * Calculate pairwise alignment score
   * @param {string} seq1 - First sequence (with gaps)
   * @param {string} seq2 - Second sequence (with gaps)
   * @returns {Object} Score breakdown
   */
  calculatePairwiseScore(seq1, seq2) {
    if (seq1.length !== seq2.length) {
      throw new Error(
        "Sequences must be of equal length for alignment scoring"
      );
    }

    let matches = 0;
    let mismatches = 0;
    let gaps = 0;
    let score = 0;
    let gapRuns = 0;
    let inGap = false;

    for (let i = 0; i < seq1.length; i++) {
      const char1 = seq1[i].toUpperCase();
      const char2 = seq2[i].toUpperCase();

      if (char1 === "-" || char2 === "-") {
        gaps++;
        if (!inGap) {
          score += this.gapPenalty;
          gapRuns++;
          inGap = true;
        } else {
          score += this.gapExtensionPenalty;
        }
      } else {
        inGap = false;
        if (char1 === char2) {
          matches++;
          score += this.matchScore;
        } else {
          mismatches++;
          score += this.mismatchScore;
        }
      }
    }

    const identity = (matches / (matches + mismatches + gaps)) * 100;
    const similarity = (matches / (seq1.length - gaps)) * 100;

    return {
      score: score,
      matches: matches,
      mismatches: mismatches,
      gaps: gaps,
      gapRuns: gapRuns,
      identity: parseFloat(identity.toFixed(2)),
      similarity: parseFloat(similarity.toFixed(2)),
      length: seq1.length,
    };
  }

  /**
   * Calculate multiple sequence alignment statistics
   * @param {Array} sequences - Array of sequence objects
   * @returns {Object} MSA statistics
   */
  calculateMSAStats(sequences) {
    if (sequences.length < 2) {
      throw new Error("Need at least 2 sequences for MSA scoring");
    }

    const alignmentLength = sequences[0].sequence.length;
    const numSequences = sequences.length;

    // Check all sequences have same length
    for (let seq of sequences) {
      if (seq.sequence.length !== alignmentLength) {
        throw new Error("All sequences must be same length in MSA");
      }
    }

    let conservedPositions = 0;
    let totalScore = 0;
    let pairwiseScores = [];

    // Calculate conservation per position
    for (let pos = 0; pos < alignmentLength; pos++) {
      const chars = sequences.map((seq) => seq.sequence[pos].toUpperCase());
      const uniqueChars = new Set(chars.filter((c) => c !== "-"));

      if (uniqueChars.size === 1 && !uniqueChars.has("-")) {
        conservedPositions++;
      }
    }

    // Calculate all pairwise scores
    for (let i = 0; i < numSequences; i++) {
      for (let j = i + 1; j < numSequences; j++) {
        const pairScore = this.calculatePairwiseScore(
          sequences[i].sequence,
          sequences[j].sequence
        );
        pairwiseScores.push(pairScore);
        totalScore += pairScore.score;
      }
    }

    const avgIdentity =
      pairwiseScores.reduce((sum, ps) => sum + ps.identity, 0) /
      pairwiseScores.length;
    const avgScore = totalScore / pairwiseScores.length;
    const conservation = (conservedPositions / alignmentLength) * 100;

    return {
      numSequences: numSequences,
      alignmentLength: alignmentLength,
      conservedPositions: conservedPositions,
      conservation: parseFloat(conservation.toFixed(2)),
      averageScore: parseFloat(avgScore.toFixed(2)),
      averageIdentity: parseFloat(avgIdentity.toFixed(2)),
      pairwiseScores: pairwiseScores,
      totalPairs: pairwiseScores.length,
    };
  }

  /**
   * Generate HTML report of alignment statistics
   * @param {Object} stats - Statistics from calculateMSAStats
   * @returns {string} HTML report
   */
  generateHTMLReport(stats) {
    const html = `
            <div style="background-color: #f8f9fa; padding: 15px; margin: 10px 0; border: 1px solid #dee2e6; border-radius: 4px;">
                <h4>Alignment Quality Report</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <strong>Basic Statistics:</strong>
                        <ul style="margin: 5px 0;">
                            <li>Number of sequences: ${stats.numSequences}</li>
                            <li>Alignment length: ${stats.alignmentLength}</li>
                            <li>Conserved positions: ${
                              stats.conservedPositions
                            }</li>
                            <li>Conservation: ${stats.conservation}%</li>
                        </ul>
                    </div>
                    <div>
                        <strong>Quality Metrics:</strong>
                        <ul style="margin: 5px 0;">
                            <li>Average score: ${stats.averageScore}</li>
                            <li>Average identity: ${stats.averageIdentity}%</li>
                            <li>Pairwise comparisons: ${stats.totalPairs}</li>
                        </ul>
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <strong>Quality Assessment:</strong>
                    <span style="color: ${this.getQualityColor(
                      stats.averageIdentity
                    )}; font-weight: bold;">
                        ${this.getQualityLabel(stats.averageIdentity)}
                    </span>
                </div>
            </div>
        `;
    return html;
  }

  /**
   * Get quality color based on identity percentage
   */
  getQualityColor(identity) {
    if (identity >= 80) return "#28a745";
    if (identity >= 60) return "#ffc107";
    if (identity >= 40) return "#fd7e14";
    return "#dc3545";
  }

  /**
   * Get quality label based on identity percentage
   */
  getQualityLabel(identity) {
    if (identity >= 80) return "Excellent";
    if (identity >= 60) return "Good";
    if (identity >= 40) return "Fair";
    return "Poor";
  }

  /**
   * Set custom scoring parameters
   * @param {Object} params - {matchScore, mismatchScore, gapPenalty, gapExtensionPenalty}
   */
  setParameters(params) {
    if (params.matchScore !== undefined) this.matchScore = params.matchScore;
    if (params.mismatchScore !== undefined)
      this.mismatchScore = params.mismatchScore;
    if (params.gapPenalty !== undefined) this.gapPenalty = params.gapPenalty;
    if (params.gapExtensionPenalty !== undefined)
      this.gapExtensionPenalty = params.gapExtensionPenalty;
  }
}

// Make it available globally and as module
if (typeof window !== "undefined") {
  window.AlignmentScorer = AlignmentScorer;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = AlignmentScorer;
}
