// ==============================================================================
// AgriSage AI: Hackathon Demonstration Mode Routes
// One-click loading and clearing of rich agricultural sample records
// ==============================================================================

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { agriStore } from '../services/db/agriStore.js';
import { documentStore } from '../services/db/documentStore.js';
import { randomUUID } from 'crypto';

const router = Router();

// POST /api/v1/demo/load
router.post('/load', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;

    // 1. Load sample farm, crops, and pest diagnosis advisory
    const demoData = await agriStore.loadDemoData(ownerId);

    // 2. Load sample agricultural document: Soil Health Card
    const docId = randomUUID();
    const storagePath = `samples/${ownerId}/${docId}/Soil_Health_Card_Guntur_Sample.pdf`;

    const sampleDoc = await documentStore.createDocument({
      id: docId,
      owner_id: ownerId,
      original_name: 'Soil_Health_Card_Guntur_Sample.pdf',
      mime_type: 'application/pdf',
      size_bytes: 245760,
      storage_path: storagePath,
      category: 'soil_test_report',
      custom_category: null,
      tags: ['Soil Health', 'Demo Sample', 'NPK Test', 'Guntur Lab'],
    });

    // Mark as sample in memory if supported
    (sampleDoc as any).is_sample = true;

    // 3. Attach realistic extracted Soil Health Card fields
    const rawText = `GOVERNMENT OF ANDHRA PRADESH - DEPARTMENT OF AGRICULTURE
DISTRICT SOIL TESTING LABORATORY, REGIONAL AGRICULTURAL RESEARCH STATION (RARS), LAM, GUNTUR
SOIL HEALTH CARD (DEMO SAMPLE)
Farmer Name: Krishna Valley Demonstration Farm
Sample No: GTR/SOIL/2026/0489
Village/Locality: Chilakaluripet, Guntur District
Date of Sampling: 10-06-2026 | Date of Testing: 18-06-2026
--------------------------------------------------------------------------------------------------
PARAMETER                   TEST VALUE    UNIT          RATING        TARGET SUITABILITY
--------------------------------------------------------------------------------------------------
1. Soil Reaction (pH)       7.4           -             Neutral       Optimal (6.5 - 7.8)
2. Electrical Conductivity  0.42          dS/m          Normal        Non-saline (< 1.0)
3. Organic Carbon (OC)      0.65          %             Medium        Desired > 0.75%
4. Available Nitrogen (N)   245           kg/ha         Low           Needs replenishment (< 280)
5. Available Phosphorus (P) 24.8          kg/ha         Medium        Adequate (11 - 25)
6. Available Potassium (K)  310           kg/ha         High          Rich reserve (> 280)
7. Available Zinc (Zn)      0.58          ppm (mg/kg)   Deficient     Critical limit: 0.60 ppm
8. Available Boron (B)      0.65          ppm           Sufficient    Normal (0.50 - 1.00)
--------------------------------------------------------------------------------------------------
FERTILIZER & SOIL CONDITIONING RECOMMENDATION:
- Apply Farm Yard Manure (FYM) @ 5 tonnes/acre to enhance organic carbon.
- Apply 25% additional Nitrogen split in 3 vegetative doses for Chilli / Cotton.
- Apply Zinc Sulphate (ZnSO4 21%) @ 25 kg/acre as basal dressing.
- Soil is non-saline with balanced calcium carbonate; no gypsum or lime required.`;

    const extractionResult = {
      schemaVersion: '1.0',
      documentType: 'soil_test_report',
      summary:
        'Official Soil Health Card from District Soil Testing Lab, RARS Lam Farm, Guntur. Indicates neutral pH 7.4, medium organic carbon (0.65%), deficient available nitrogen (245 kg/ha), adequate phosphorus, rich potassium reserve, and slight zinc deficiency (0.58 ppm).',
      fields: [
        {
          key: 'farmer_name',
          label: 'Farmer / Farm Name',
          value: 'Krishna Valley Demonstration Farm',
          normalizedValue: 'Krishna Valley Demonstration Farm',
          confidence: 0.98,
          evidence: 'Farmer Name: Krishna Valley Demonstration Farm',
        },
        {
          key: 'sample_id',
          label: 'Soil Sample ID',
          value: 'GTR/SOIL/2026/0489',
          normalizedValue: 'GTR/SOIL/2026/0489',
          confidence: 0.99,
          evidence: 'Sample No: GTR/SOIL/2026/0489',
        },
        {
          key: 'laboratory_name',
          label: 'Testing Laboratory',
          value: 'District Soil Testing Laboratory, RARS Lam, Guntur',
          normalizedValue: 'District Soil Testing Laboratory, RARS Lam, Guntur',
          confidence: 0.97,
          evidence: 'DISTRICT SOIL TESTING LABORATORY, REGIONAL AGRICULTURAL RESEARCH STATION (RARS), LAM, GUNTUR',
        },
        {
          key: 'soil_ph',
          label: 'Soil Reaction (pH)',
          value: '7.4',
          normalizedValue: '7.4',
          confidence: 0.99,
          evidence: '1. Soil Reaction (pH)       7.4           -             Neutral',
        },
        {
          key: 'electrical_conductivity_ec',
          label: 'Electrical Conductivity (EC)',
          value: '0.42 dS/m',
          normalizedValue: '0.42',
          confidence: 0.96,
          evidence: '2. Electrical Conductivity  0.42          dS/m          Normal',
        },
        {
          key: 'organic_carbon_oc',
          label: 'Organic Carbon (OC %)',
          value: '0.65 %',
          normalizedValue: '0.65',
          confidence: 0.97,
          evidence: '3. Organic Carbon (OC)      0.65          %             Medium',
        },
        {
          key: 'available_nitrogen_n',
          label: 'Available Nitrogen (N)',
          value: '245 kg/ha (Low)',
          normalizedValue: '245',
          confidence: 0.98,
          evidence: '4. Available Nitrogen (N)   245           kg/ha         Low',
        },
        {
          key: 'available_phosphorus_p',
          label: 'Available Phosphorus (P2O5)',
          value: '24.8 kg/ha (Medium)',
          normalizedValue: '24.8',
          confidence: 0.98,
          evidence: '5. Available Phosphorus (P) 24.8          kg/ha         Medium',
        },
        {
          key: 'available_potassium_k',
          label: 'Available Potassium (K2O)',
          value: '310 kg/ha (High)',
          normalizedValue: '310',
          confidence: 0.98,
          evidence: '6. Available Potassium (K)  310           kg/ha         High',
        },
        {
          key: 'available_zinc_zn',
          label: 'Available Zinc (Zn)',
          value: '0.58 ppm (Deficient)',
          normalizedValue: '0.58',
          confidence: 0.95,
          evidence: '7. Available Zinc (Zn)      0.58          ppm (mg/kg)   Deficient',
        },
      ],
      warnings: [
        'Available Nitrogen (245 kg/ha) is below critical threshold of 280 kg/ha; requires split top-dressing.',
        'Zinc is deficient at 0.58 ppm (below critical limit 0.60 ppm); basal zinc sulphate recommended.',
      ],
    };

    await documentStore.completeDocumentProcessing(docId, ownerId, rawText, {
      provider: 'google-gemini (gemini-3.8-flash)',
      model: 'gemini-3.8-flash',
      schemaVersion: '1.0',
      result: extractionResult,
      warnings: extractionResult.warnings,
    });

    res.status(201).json({
      success: true,
      message: 'Demonstration sample agricultural records successfully loaded.',
      data: {
        farm: demoData.farm,
        crops: demoData.crops,
        advisory: demoData.advisory,
        document: sampleDoc,
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/demo/clean
router.delete('/clean', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const removedCount = await agriStore.clearDemoData(ownerId);

    res.json({
      success: true,
      message: `Cleared ${removedCount} sample demonstration records.`,
      data: { removedCount },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
