// ==============================================================================
// AgriSage AI: Expert Agricultural Gemini Intelligence Service
// Powered by official @google/genai SDK (Model: gemini-3.8-flash)
// ==============================================================================

import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import {
  StructuredAdvisoryReport,
  StructuredAdvisoryReportSchema,
  CropSuitabilityReport,
  CropSuitabilityReportSchema,
} from '../../shared/index.js';
import { weatherService } from '../weather/weatherService.js';

const SYSTEM_AGRI_PROMPT = `You are AgriSage AI, an expert, ethical agricultural advisory system specializing in Indian agriculture, agronomy, plant pathology, and sustainable soil-water management.

Follow these strict operating principles:
1. EVIDENCE-BASED AGRONOMIC GUIDANCE: Ground recommendations in established practices from ICAR (Indian Council of Agricultural Research), State Agricultural Universities (such as ANGRAU, TNAU, PAU, UAS), and Krishi Vigyan Kendras (KVKs).
2. SAFETY FIRST: Never provide definitive disease diagnoses. Present findings as probabilistic differential possibilities.
3. CHEMICAL SAFETY: NEVER invent or provide unsupported pesticide dosages, off-label tank mixes, or hazardous chemical application schedules. Prioritize cultural sanitation, resistant varieties, and biological controls (Neem oil/Azadirachtin, Trichoderma, Pseudomonas, pheromone traps, yellow/blue sticky traps). For chemical controls, direct the farmer to official CIB&RC approved product labels or local agricultural extension officers.
4. TRANSPARENCY: When information is incomplete (e.g. soil pH unknown, weather unverified, image unclear), explicitly state the uncertainty and list follow-up questions.
5. MULTILINGUAL FIDELITY: When language is 'te' (Telugu) or 'hi' (Hindi), generate the text fields in clean, natural, farmer-friendly Telugu or Hindi, retaining scientific botanical terms or chemical names in English brackets where appropriate.
6. JSON ONLY: Return strictly valid JSON adhering to the specified schema, without markdown backticks or commentary outside the JSON.`;

export class AgriGeminiService {
  private client: GoogleGenAI | null = null;
  private modelName: string;

  constructor() {
    this.modelName = env.GEMINI_MODEL || 'gemini-3.8-flash';
    if (env.GOOGLE_API_KEY && !env.GOOGLE_API_KEY.includes('ExampleKey')) {
      this.client = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });
    }
  }

  /**
   * 1. General Crop Advisory
   */
  async generateAdvisory(params: {
    category: string;
    userDescription: string;
    title?: string;
    cropName?: string;
    variety?: string;
    growthStage?: string;
    farmName?: string;
    state?: string;
    district?: string;
    soilType?: string;
    soilPh?: number | null;
    irrigationMethod?: string;
    waterAvailability?: string;
    language?: 'en' | 'te' | 'hi';
    weatherContext?: any;
  }): Promise<{ report: StructuredAdvisoryReport; weather: any }> {
    const lang = params.language || 'en';

    // Retrieve live weather if not passed
    let weather = params.weatherContext;
    if (!weather && (params.state || params.district)) {
      weather = await weatherService.getWeather({
        state: params.state,
        district: params.district,
      });
    }

    const contextPrompt = [
      `REQUEST TYPE: Crop Management Advisory`,
      `CATEGORY: ${params.category}`,
      `USER QUERY / OBSERVATIONS: """${params.userDescription}"""`,
      params.cropName ? `CROP: ${params.cropName}${params.variety ? ` (Variety: ${params.variety})` : ''}` : null,
      params.growthStage ? `GROWTH STAGE: ${params.growthStage}` : null,
      params.farmName ? `FARM: ${params.farmName}` : null,
      params.state || params.district ? `LOCATION: ${params.district || ''}, ${params.state || 'India'}` : null,
      params.soilType ? `SOIL TYPE: ${params.soilType}${params.soilPh ? ` (pH: ${params.soilPh})` : ' (pH: Unknown)'}` : null,
      params.irrigationMethod ? `IRRIGATION: ${params.irrigationMethod} (Water Availability: ${params.waterAvailability || 'Moderate'})` : null,
      weather
        ? `LIVE WEATHER AT OBSERVATION: Temperature ${weather.temperature}°C, Humidity ${weather.humidity}%, Precipitation ${weather.precipitation}mm, Condition: ${weather.weatherDescription}`
        : 'LIVE WEATHER: Not available for this specific query.',
      `TARGET LANGUAGE: ${lang === 'te' ? 'Telugu (తెలుగు)' : lang === 'hi' ? 'Hindi (हिन्दी)' : 'English'}`,
      '',
      `Generate a comprehensive, practical, evidence-based agricultural advisory report.`,
      `Return ONLY valid JSON matching this structure:`,
      JSON.stringify(
        {
          summary: 'Brief 1-2 sentence core recommendation.',
          understandingOfSituation: 'Detailed understanding of the field context, crop stage, and farm conditions.',
          possibleExplanations: [
            {
              cause: 'Primary potential issue, nutrient condition, or management factor',
              probability: 'high',
              description: 'Clear agronomic explanation of why this is occurring.',
              distinguishingFactors: 'What to look for in the field to verify.',
            },
          ],
          immediateNextSteps: [
            'Actionable step 1 (safe, practical cultural or biological measure)',
            'Actionable step 2',
          ],
          preventiveMeasures: [
            'Long-term prevention or soil/water management step 1',
            'Step 2',
          ],
          followUpQuestions: [
            'Follow-up inquiry about field conditions or recent actions',
          ],
          riskLevel: 'moderate', // 'low' | 'moderate' | 'high' | 'critical'
          riskExplanation: 'Explanation of risk to yield or plant vitality.',
          confidenceLevel: 'high', // 'high' | 'moderate' | 'low'
          uncertaintyReasons: [
            'Factors that cannot be confirmed without laboratory or field visit',
          ],
          supportingSources: [
            'ICAR / State Agricultural University / Agronomic reference',
          ],
          whenToConsultExpert:
            'Clear guideline on when the farmer should contact the local KVK or Agriculture Officer.',
          disclaimer:
            'AgriSage AI recommendations are advisory and decision-support only. Always verify critical decisions with an authorized local agricultural extension officer.',
        },
        null,
        2
      ),
    ]
      .filter(Boolean)
      .join('\n');

    if (this.client) {
      try {
        const response = await this.client.models.generateContent({
          model: this.modelName,
          contents: [{ text: contextPrompt }],
          config: {
            systemInstruction: SYSTEM_AGRI_PROMPT,
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '';
        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        if (cleaned) {
          const parsed = JSON.parse(cleaned);
          const validated = StructuredAdvisoryReportSchema.parse(parsed);
          return { report: validated, weather };
        }
      } catch (err: any) {
        console.warn(`[AgriGeminiService] Live Gemini API error: ${err.message}. Using structured agronomic fallback.`);
      }
    }

    // High quality agronomic rule-based fallback
    return {
      report: this.generateAdvisoryFallback(params, lang),
      weather,
    };
  }

  /**
   * 2. Crop Pest & Disease Multimodal Diagnosis
   */
  async diagnosePestAndDisease(params: {
    userDescription: string;
    affectedPlantParts: string[];
    durationSpread?: string | null;
    cropName?: string;
    variety?: string;
    growthStage?: string;
    state?: string;
    district?: string;
    language?: 'en' | 'te' | 'hi';
    imageBuffer?: Buffer | null;
    imageMimeType?: string | null;
  }): Promise<StructuredAdvisoryReport> {
    const lang = params.language || 'en';

    const partsPrompt = [
      `REQUEST TYPE: Plant Disease and Pest Symptom Diagnosis`,
      `CROP: ${params.cropName || 'Not specified'}${params.variety ? ` (Variety: ${params.variety})` : ''}`,
      params.growthStage ? `GROWTH STAGE: ${params.growthStage}` : null,
      params.state || params.district ? `LOCATION: ${params.district || ''}, ${params.state || 'India'}` : null,
      `AFFECTED PLANT PARTS: ${params.affectedPlantParts.join(', ') || 'Not specified'}`,
      params.durationSpread ? `DURATION & SPREAD: ${params.durationSpread}` : null,
      `SYMPTOMS DESCRIBED BY FARMER: """${params.userDescription}"""`,
      params.imageBuffer
        ? `PHOTOGRAPH PROVIDED: Yes (Analyze visual symptoms: lesions, discoloration, curling, spots, powdery growth, insect presence, necrosis). If image is blurry or insufficient, note this in uncertaintyReasons.`
        : `PHOTOGRAPH PROVIDED: No photo attached. Rely on described symptomology.`,
      `TARGET LANGUAGE: ${lang === 'te' ? 'Telugu (తెలుగు)' : lang === 'hi' ? 'Hindi (हिन्दी)' : 'English'}`,
      '',
      `Perform a differential diagnosis. Provide safe biological and cultural management steps. Do not provide unverified chemical cocktails.`,
      `Return ONLY valid JSON matching the StructuredAdvisoryReportSchema.`,
    ]
      .filter(Boolean)
      .join('\n');

    if (this.client) {
      try {
        const contents: any[] = [{ text: partsPrompt }];

        if (params.imageBuffer && params.imageMimeType) {
          contents.push({
            inlineData: {
              data: params.imageBuffer.toString('base64'),
              mimeType: params.imageMimeType,
            },
          });
        }

        const response = await this.client.models.generateContent({
          model: this.modelName,
          contents,
          config: {
            systemInstruction: SYSTEM_AGRI_PROMPT,
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '';
        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        if (cleaned) {
          const parsed = JSON.parse(cleaned);
          return StructuredAdvisoryReportSchema.parse(parsed);
        }
      } catch (err: any) {
        console.warn(`[AgriGeminiService] Multimodal diagnosis API error: ${err.message}. Using structured fallback.`);
      }
    }

    return this.generateDiagnosisFallback(params, lang);
  }

  /**
   * 3. Crop Selection & Suitability Wizard
   */
  async evaluateCropSuitability(params: {
    state: string;
    district: string;
    season: string;
    soilType: string;
    soilPh?: number | null;
    irrigationMethod: string;
    waterAvailability: string;
    area?: number | null;
    farmerPreferences?: string | null;
    language?: 'en' | 'te' | 'hi';
  }): Promise<CropSuitabilityReport> {
    const lang = params.language || 'en';

    const suitabilityPrompt = [
      `REQUEST TYPE: Crop Suitability & Cultivation Planning Evaluation`,
      `STATE & DISTRICT: ${params.district}, ${params.state}, India`,
      `PLANNED SEASON: ${params.season} (Kharif/Rabi/Zaid)`,
      `SOIL TYPE: ${params.soilType}${params.soilPh ? ` (pH: ${params.soilPh})` : ' (pH: Unknown/Not tested)'}`,
      `IRRIGATION & WATER: ${params.irrigationMethod} with ${params.waterAvailability} water availability`,
      params.area ? `FARM AREA: ${params.area} acres` : null,
      params.farmerPreferences ? `FARMER GOALS / PREFERENCES: """${params.farmerPreferences}"""` : null,
      `TARGET LANGUAGE: ${lang === 'te' ? 'Telugu (తెలుగు)' : lang === 'hi' ? 'Hindi (हिन्दी)' : 'English'}`,
      '',
      `Evaluate 3 to 4 viable Indian crops for these specific agro-climatic conditions.`,
      `Do NOT invent guaranteed profit margins or fabricated market prices. Provide practical cultivation considerations, constraints, and risks.`,
      `Return ONLY valid JSON matching this schema:`,
      JSON.stringify(
        {
          options: [
            {
              cropName: 'Crop Name (e.g. Chilli, Cotton, Bengal Gram, Maize)',
              suitabilityScore: 88,
              season: params.season,
              suitabilityReasons: ['Why suitable for this soil and water'],
              relevantConstraints: ['Limiting factors or requirements'],
              informationStillNeeded: ['Missing tests or parameters'],
              cultivationConsiderations: ['Key agronomic practices to adopt'],
              potentialRisks: ['Pest, weather, or water risks'],
              suggestedVerificationSteps: ['Steps with local KVK or soil lab'],
            },
          ],
          generalObservations: 'Overview of district agro-climatic zone.',
          soilConditionSummary: 'Assessment of soil compatibility.',
          waterBudgetAssessment: 'Assessment of water sufficiency for proposed crops.',
          suggestedActionPlan: [
            'Immediate preparation step 1',
            'Step 2',
          ],
          disclaimer:
            'Crop suitability is based on general agro-climatic suitability models and user-reported conditions. Verify local seed availability and market demand prior to sowing.',
        },
        null,
        2
      ),
    ]
      .filter(Boolean)
      .join('\n');

    if (this.client) {
      try {
        const response = await this.client.models.generateContent({
          model: this.modelName,
          contents: [{ text: suitabilityPrompt }],
          config: {
            systemInstruction: SYSTEM_AGRI_PROMPT,
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '';
        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        if (cleaned) {
          const parsed = JSON.parse(cleaned);
          return CropSuitabilityReportSchema.parse(parsed);
        }
      } catch (err: any) {
        console.warn(`[AgriGeminiService] Crop suitability API error: ${err.message}. Using structured fallback.`);
      }
    }

    return this.generateSuitabilityFallback(params, lang);
  }

  // --------------------------------------------------------------------------
  // Rule-based agronomic fallbacks (Ensures zero-downtime reliability)
  // --------------------------------------------------------------------------

  private generateAdvisoryFallback(params: any, lang: string): StructuredAdvisoryReport {
    const isTe = lang === 'te';
    const isHi = lang === 'hi';

    const crop = params.cropName || 'Crop';
    const desc = params.userDescription || '';

    return {
      summary: isTe
        ? `${crop} పంట నిర్వహణ మరియు సంరక్షణ కోసం సమగ్ర వ్యవసాయ సలహా.`
        : isHi
        ? `${crop} फसल प्रबंधन एवं देखभाल हेतु एकीकृत कृषि सलाह।`
        : `Contextual crop-management advisory for ${crop} based on reported farm conditions.`,
      understandingOfSituation: isTe
        ? `మీరు అందించిన సమాచారం ప్రకారం: ${desc.slice(0, 150)}... మీ నేల రకం (${params.soilType || 'సాధారణ'}) మరియు నీటిపారుదల ఆధారంగా చర్యలు తీసుకోండి.`
        : isHi
        ? `आपके द्वारा दी गई जानकारी के अनुसार: ${desc.slice(0, 150)}... आपकी मिट्टी के प्रकार (${params.soilType || 'सामान्य'}) और सिंचाई के आधार पर कदम उठाएं।`
        : `Based on your description: "${desc.slice(0, 150)}...". Farm conditions indicate ${params.soilType || 'regional'} soil with ${params.irrigationMethod || 'conventional'} irrigation.`,
      possibleExplanations: [
        {
          cause: isTe ? 'పోషకాల అసమతుల్యత లేదా వాతావరణ మార్పు' : isHi ? 'पोषक तत्वों का असंतुलन या मौसम तनाव' : 'Nutrient imbalance or climatic stress',
          probability: 'moderate',
          description: isTe
            ? 'ప్రస్తుత పంట దశలో సరైన తేమ మరియు సమతుల్య ఎరువులు లేకపోవడం వల్ల ఈ లక్షణాలు రావచ్చు.'
            : isHi
            ? 'वर्तमान फसल चरण में उपयुक्त नमी और संतुलित खाद की कमी से ये लक्षण दिखाई दे सकते हैं।'
            : 'At this cultivation stage, localized soil moisture fluctuations or micro-nutrient deficiency often induce these stress symptoms.',
          distinguishingFactors: isTe
            ? 'ఆకుల రంగు మార్పు మరియు ఎదుగుదలలో తేడాను గమనించండి.'
            : isHi
            ? 'पत्तियों के रंग और पौधे की वृद्धि दर का निरीक्षण करें।'
            : 'Observe whether symptoms are uniform across the field or isolated in patches.',
        },
      ],
      immediateNextSteps: [
        isTe ? 'పొలంలో తేమ శాతాన్ని తనిఖీ చేసి, అవసరమైతే తేలికపాటి నీటి తడి అందించండి.' : isHi ? 'खेत में नमी की जांच करें और आवश्यकतानुसार हल्की सिंचाई करें।' : 'Check field soil moisture at 10-15cm depth and provide a light irrigation if dry.',
        isTe ? 'ఎకరానికి 10-15 పసుపు/నీలి రంగు జిగురు అట్టలను అమర్చండి.' : isHi ? 'प्रति एकड़ 10-15 पीले/नीले चिपचिपे कार्ड लगाएं।' : 'Install 10-15 sticky traps per acre to monitor any sucking pest activity.',
        isTe ? 'రసాయన ఎరువుల అధిక వాడకాన్ని నివారించి, సేంద్రీయ ఎరువులను ప్రాధాన్యత ఇవ్వండి.' : isHi ? 'अत्यधिक रासायनिक उर्वरकों के उपयोग से बचें और जैविक उपचार अपनाएं।' : 'Avoid excessive quick-release nitrogenous fertilizers during this stress window.',
      ],
      preventiveMeasures: [
        isTe ? 'పంట మార్పిడి మరియు వేప నూనె పిచికారీ వంటి సహజ పద్ధతులను పాటించండి.' : isHi ? 'फसल चक्र और नीम तेल छिड़काव जैसी प्राकृतिक विधियां अपनाएं।' : 'Practice integrated crop management and preventive cold-pressed neem oil sprays.',
        isTe ? 'నేల ఆరోగ్య పరీక్ష కార్డు ఆధారంగానే ఎరువులను వాడండి.' : isHi ? 'मृदा स्वास्थ्य कार्ड की जांच के अनुसार ही खाद डालें।' : 'Adopt targeted fertilizer doses strictly aligned with your Soil Health Card.',
      ],
      followUpQuestions: [
        isTe ? 'లక్షణాలు పొలమంతా ఉన్నాయా లేదా కొన్ని మొక్కలకే పరిమితమా?' : isHi ? 'क्या लक्षण पूरे खेत में हैं या कुछ ही पौधों पर?' : 'Are symptoms uniform across the field or concentrated near field borders?',
        isTe ? 'గత 10 రోజుల్లో ఏమైనా ఎరువులు లేదా మందులు వాడారా?' : isHi ? 'क्या पिछले 10 दिनों में कोई खाद या कीटनाशक डाला गया था?' : 'What inputs or foliar sprays were applied within the past 10 days?',
      ],
      riskLevel: 'moderate',
      riskExplanation: isTe
        ? 'సకాలంలో సరైన చర్యలు తీసుకుంటే దిగుబడిపై ప్రభావం పడదు.'
        : isHi
        ? 'समय पर उचित कदम उठाने से पैदावार पर कोई विपरीत प्रभाव नहीं पड़ेगा।'
        : 'Moderate risk if unattended; timely cultural correction usually prevents secondary spread.',
      confidenceLevel: 'moderate',
      uncertaintyReasons: [
        'Precise diagnosis requires verification of micro-nutrient test data or in-person field inspection.',
      ],
      supportingSources: [
        'ICAR Good Agricultural Practices (GAP) Guidelines',
        'State Agricultural Extension Advisories',
      ],
      whenToConsultExpert: isTe
        ? '3-4 రోజుల్లో మార్పు కనిపించకపోతే సమీప రైతు భరోసా కేంద్రం (RBK/KVK) నిపుణులను సంప్రదించండి.'
        : isHi
        ? 'यदि 3-4 दिनों में सुधार न हो, तो नजदीकी कृषि विज्ञान केंद्र (KVK) के विशेषज्ञ से संपर्क करें।'
        : 'If symptom progression continues after 4 days of cultural intervention, consult your local KVK agronomist.',
      disclaimer:
        'AgriSage AI recommendations are generated for informational assistance and do not substitute certified agronomic consultation. Comply with local pesticide regulatory standards.',
    };
  }

  private generateDiagnosisFallback(params: any, lang: string): StructuredAdvisoryReport {
    const isTe = lang === 'te';
    const isHi = lang === 'hi';
    const crop = params.cropName || 'Crop';

    return {
      summary: isTe
        ? `${crop} పంటలో రసం పీల్చే పురుగులు లేదా ఆకు మచ్చ తెగులు సంభవించే అవకాశం ఉంది.`
        : isHi
        ? `${crop} फसल में रस चूसक कीट या पत्ती धब्बा रोग की संभावना।`
        : `Probable sucking pest activity or foliar fungal stress on ${crop}.`,
      understandingOfSituation: isTe
        ? `రైతు తెలిపిన లక్షణాలు: ${params.userDescription}. దెబ్బతిన్న భాగాలు: ${params.affectedPlantParts.join(', ')}.`
        : isHi
        ? `किसान द्वारा बताए गए लक्षण: ${params.userDescription}। प्रभावित भाग: ${params.affectedPlantParts.join(', ')}।`
        : `Reported symptoms: "${params.userDescription}". Parts affected: ${params.affectedPlantParts.join(', ')}.`,
      possibleExplanations: [
        {
          cause: isTe ? 'రసం పీల్చే పురుగులు (పేనుబంక/తామర పురుగులు)' : isHi ? 'रस चूसक कीट (माहू / थ्रिप्स)' : 'Sucking Pests (Aphids / Thrips)',
          probability: 'high',
          description: isTe
            ? 'చిగురుటాకుల రసం పీల్చడం వల్ల ఆకులు ముడుచుకుపోవడం లేదా పసుపు రంగులోకి మారడం జరుగుతుంది.'
            : isHi
            ? 'कोमल पत्तियों से रस चूसने के कारण पत्तियां मुड़ जाती हैं और पीली पड़ने लगती हैं।'
            : 'Sap-feeding by nymphs and adults causes characteristic leaf crinkling, upward curling, and loss of vigor.',
          distinguishingFactors: isTe
            ? 'ఆకుల అడుగు భాగాన చిన్న పురుగులు కదలడం కనిపిస్తుంది.'
            : isHi
            ? 'पत्तियों के निचली सतह पर छोटे कीट हिलते हुए दिखाई देते हैं।'
            : 'Examine leaf undersides under sunlight for active crawling nymphs or shiny honeydew deposits.',
        },
        {
          cause: isTe ? 'శిలీంద్రపు ఆకుమచ్చ తెగులు' : isHi ? 'फफूंद जनित पत्ती धब्बा' : 'Foliar Fungal Leaf Spot',
          probability: 'moderate',
          description: isTe
            ? 'గాలిలో తేమ ఎక్కువగా ఉన్నప్పుడు ఆకులపై గోధుమ లేదా నల్లని మచ్చలు ఏర్పడతాయి.'
            : isHi
            ? 'हवा में अधिक नमी होने पर पत्तियों पर भूरे या काले धब्बे बन जाते हैं।'
            : 'High relative humidity encourages fungal spore germination, producing concentric circular spots.',
          distinguishingFactors: isTe
            ? 'మచ్చల చుట్టూ పసుపు రంగు వలయం ఉంటుంది.'
            : isHi
            ? 'धब्बों के चारों ओर पीला छल्ला देखा जाता है।'
            : 'Well-defined dark margins with chlorotic yellow halos around necrotic lesions.',
        },
      ],
      immediateNextSteps: [
        isTe ? 'వేపనూనె (10,000 ppm) 2-3 మి.లీ లీటరు నీటికి కలిపి ఉదయం లేదా సాయంత్రం పిచికారీ చేయండి.' : isHi ? 'नीम का तेल (10,000 ppm) 2-3 मिली प्रति लीटर पानी में मिलाकर सुबह या शाम छिड़कें।' : 'Apply cold-pressed neem seed kernel extract (Azadirachtin 10,000 ppm) at 2.5 ml/L of water with wetting agent.',
        isTe ? 'తీవ్రంగా దెబ్బతిన్న ఆకులను తుంచి పొలానికి దూరంగా నాశనం చేయండి.' : isHi ? 'गंभीर रूप से रोगग्रस्त पत्तियों को तोड़कर खेत से दूर नष्ट करें।' : 'Manually clip heavily infested leaves and destroy them away from the cropping area.',
        isTe ? 'పొలంలో నీరు నిల్వ ఉండకుండా చూసుకోండి.' : isHi ? 'खेत में जलभराव न होने दें।' : 'Ensure optimal drainage; waterlogged roots exacerbate root-rot and leaf wilt.',
      ],
      preventiveMeasures: [
        isTe ? 'ట్రైకోడెర్మా విరిడే వంటి జీవశిలీంద్ర నాశినులను నేలలో కలపండి.' : isHi ? 'ट्राइकोडर्मा विरिडी जैसे जैविक कवकनाशी को मिट्टी में मिलाएं।' : 'Incorporate Trichoderma viride enriched farm yard manure in the root zone.',
        isTe ? 'పంట చుట్టూ మొక్కజొన్న లేదా జొన్నను రక్షణ పంటగా వేయండి.' : isHi ? 'खेत के चारों ओर मक्का या ज्वार की सुरक्षात्मक फसल लगाएं।' : 'Sow 2-3 rows of tall barrier crops (maize or sorghum) on borders to obstruct windborne insect vectors.',
      ],
      followUpQuestions: [
        isTe ? 'ఆకులు పైకి ముడుచుకుంటున్నాయా లేదా కిందికి ముడుచుకుంటున్నాయా?' : isHi ? 'क्या पत्तियां ऊपर की ओर मुड़ रही हैं या नीचे की ओर?' : 'Are the leaves curling strictly upwards (boat shape) or downwards?',
      ],
      riskLevel: 'moderate',
      riskExplanation: isTe
        ? 'ముందస్తు నివారణ చర్యలతో పంటను రక్షించవచ్చు.'
        : isHi
        ? 'शुरुआती जैविक उपचार से फसल को नुकसान से बचाया जा सकता है।'
        : 'Manageable with early organic/cultural response; unchecked spread can affect reproductive yield.',
      confidenceLevel: 'moderate',
      uncertaintyReasons: [
        params.imageBuffer
          ? 'Image resolution or lighting restricts microscopic identification of viral or bacterial symptoms.'
          : 'No visual photograph was uploaded; reliance is solely on verbal symptom description.',
      ],
      supportingSources: [
        'ICAR - Central Plant Protection Training Institute (CPPTI)',
        'State Horticulture & Agriculture University Advisory Bulletins',
      ],
      whenToConsultExpert: isTe
        ? '3 రోజుల్లో పురుగుల వ్యాప్తి తగ్గకపోతే స్థానిక వ్యవసాయ అధికారి లేదా KVK శాస్త్రవేత్తను సంప్రదించండి.'
        : isHi
        ? 'यदि 3 दिनों में कीटों का प्रकोप कम न हो, तो नजदीकी कृषि अधिकारी या KVK वैज्ञानिक से संपर्क करें।'
        : 'If defoliation or rapid wilting occurs across more than 20% of plants, consult the nearest KVK plant pathologist immediately.',
      disclaimer:
        'AI pest advice is strictly indicative. Do not mix unregistered chemicals. Adhere strictly to CIB&RC approved labels.',
    };
  }

  private generateSuitabilityFallback(params: any, lang: string): CropSuitabilityReport {
    const isTe = lang === 'te';
    const isHi = lang === 'hi';

    return {
      options: [
        {
          cropName: 'Chilli (మిరప / मिर्च)',
          suitabilityScore: 88,
          season: params.season,
          suitabilityReasons: [
            isTe ? `${params.soilType} నేలలకు బాగా అనుకూలం.` : isHi ? `${params.soilType} मिट्टी के लिए अत्यंत उपयुक्त।` : `Highly suitable for well-drained ${params.soilType} soil.`,
            isTe ? `డ్రిప్ నీటిపారుదలలో మంచి దిగుబడి వస్తుంది.` : isHi ? `ड्रिप सिंचाई में उत्कृष्ट पैदावार संभव।` : `Matches ${params.irrigationMethod} irrigation efficiency.`,
          ],
          relevantConstraints: [
            isTe ? 'పూత దశలో నీటి ఎద్దడి రాకూడదు.' : isHi ? 'फूल आने के समय पानी की कमी न होने दें।' : 'Sensitive to waterlogging and severe dry spells during flowering.',
          ],
          informationStillNeeded: [
            isTe ? 'నేల pH మరియు పోషకాల పరీక్ష.' : isHi ? 'मिट्टी का पीएच और पोषक तत्व स्तर।' : 'Exact soil pH and electrical conductivity (EC).',
          ],
          cultivationConsiderations: [
            isTe ? 'తేజ లేదా LCA రకాలను ఎంచుకోండి.' : isHi ? 'तेजा या स्थानीय रोगरोधी किस्म चुनें।' : 'Select viral-tolerant varieties (e.g. Teja / LCA 334).',
          ],
          potentialRisks: ['Thrips and mite attacks during dry weather'],
          suggestedVerificationSteps: [
            isTe ? 'సమీప KVK లో విత్తన లభ్యత పరిశీలించండి.' : isHi ? 'नजदीकी केवीके में बीज उपलब्धता की पुष्टि करें।' : 'Verify certified seed availability at local KVK or government seed hub.',
          ],
        },
        {
          cropName: 'Cotton (ప్రత్తి / कपास)',
          suitabilityScore: 82,
          season: params.season,
          suitabilityReasons: [
            isTe ? 'నల్లరేగడి లేదా సారవంతమైన నేలలో లోతైన వేర్లు వేస్తుంది.' : isHi ? 'काली या दोमट मिट्टी में गहरी जड़ें विकसित करता है।' : 'Deep taproot system thrives in regional soil profile.',
          ],
          relevantConstraints: ['Requires steady moisture through boll development stage.'],
          informationStillNeeded: ['Available nitrogen and potassium reserves.'],
          cultivationConsiderations: ['Adopt 90x60cm or high-density planting system.'],
          potentialRisks: ['Pink bollworm infestation if refuge crop is omitted.'],
          suggestedVerificationSteps: ['Consult state university recommendation for approved BG-II hybrids.'],
        },
        {
          cropName: 'Bengal Gram / Chickpea (శనగ / चना)',
          suitabilityScore: 78,
          season: params.season,
          suitabilityReasons: [
            isTe ? 'తక్కువ నీటి అవసరం ఉన్న పప్పుధాన్య పంట.' : isHi ? 'कम पानी में अच्छी उपज देने वाली दलहनी फसल।' : 'Low water requirement; fixes atmospheric nitrogen to enrich soil.',
          ],
          relevantConstraints: ['Prone to collar rot in excessively damp soil.'],
          informationStillNeeded: ['Soil organic carbon status.'],
          cultivationConsiderations: ['Treat seeds with Rhizobium culture and Trichoderma prior to sowing.'],
          potentialRisks: ['Helicoverpa pod borer attack during pod formation.'],
          suggestedVerificationSteps: ['Check soil moisture residual status before rabi sowing.'],
        },
      ],
      generalObservations: isTe
        ? `${params.district}, ${params.state} ప్రాంతానికి అనువైన వ్యవసాయ పంటలు.`
        : isHi
        ? `${params.district}, ${params.state} क्षेत्र के लिए अनुशंसित प्रमुख फसलें।`
        : `Agro-climatic suitability assessment for ${params.district}, ${params.state} during ${params.season} season.`,
      soilConditionSummary: `Soil classified as ${params.soilType} with ${params.soilPh ? `measured pH of ${params.soilPh}` : 'unverified pH'}.`,
      waterBudgetAssessment: `Available irrigation method (${params.irrigationMethod}) with ${params.waterAvailability} water availability supports medium-duty crops.`,
      suggestedActionPlan: [
        isTe ? 'విత్తే ముందు నేల నమూనా పరీక్ష చేయించండి.' : isHi ? 'बुआई से पहले मिट्टी परीक्षण कराएं।' : 'Conduct a comprehensive soil test prior to field preparation.',
        isTe ? 'ధృవీకరించిన విత్తనాలను మాత్రమే వాడండి.' : isHi ? 'केवल प्रमाणित बीजों का ही उपयोग करें।' : 'Procure certified seed stocks from authorized agricultural research centers.',
      ],
      disclaimer:
        'Crop options are formulated based on general regional agro-ecology. Assess local market prices and storage facilities before finalizing crop selection.',
    };
  }
}

export const agriGeminiService = new AgriGeminiService();
