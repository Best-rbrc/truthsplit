import { AnalysisResult } from "@/types/analysis";

export const mockAnalysisResult: AnalysisResult = {
  claims: [
    {
      claim_id: "claim_1",
      claim_text: "The government should implement universal basic income",
      premises: [
        "Automation is eliminating many jobs",
        "People need financial security to pursue meaningful work"
      ],
      worldview_analyses: {
        libertarian: {
          position: "oppose",
          reasoning: "Universal Basic Income represents government overreach and creates dependency. Market-based solutions and voluntary charity are preferable to coercive wealth redistribution. It undermines personal responsibility and the work ethic essential to a free society.",
          key_assumptions: [
            "Free markets efficiently allocate resources",
            "Government intervention distorts incentives",
            "Individual responsibility drives prosperity"
          ],
          consistency_scores: {
            premise_claim: 0.45,
            worldview_internal: 0.92
          },
          confidence: 0.88
        },
        religious_conservative: {
          position: "conditional",
          reasoning: "While caring for the poor is a moral imperative, UBI could undermine family structures and work as divine calling. Support conditional on provisions that encourage work, family formation, and community involvement rather than creating secular dependency.",
          key_assumptions: [
            "Work is part of divine purpose",
            "Family and community provide primary support",
            "Moral hazard of dependency concerns"
          ],
          consistency_scores: {
            premise_claim: 0.62,
            worldview_internal: 0.78
          },
          confidence: 0.72
        },
        eco_justice: {
          position: "support",
          reasoning: "Universal Basic Income addresses systemic inequality and provides economic security necessary for environmental action. It decouples survival from exploitation of natural resources and enables people to make sustainable choices.",
          key_assumptions: [
            "Economic security enables environmental stewardship",
            "Systemic inequality requires structural solutions",
            "Basic needs are human rights"
          ],
          consistency_scores: {
            premise_claim: 0.82,
            worldview_internal: 0.88
          },
          confidence: 0.85
        },
        populist_nationalist: {
          position: "support",
          reasoning: "UBI protects working people from exploitation by global elites and corporations. It ensures national citizens benefit from their nation's wealth rather than seeing it flow to multinational corporations and foreign interests.",
          key_assumptions: [
            "National sovereignty includes economic protection",
            "Global capitalism exploits domestic workers",
            "Citizens deserve share of national wealth"
          ],
          consistency_scores: {
            premise_claim: 0.75,
            worldview_internal: 0.85
          },
          confidence: 0.80
        }
      }
    },
    {
      claim_id: "claim_2",
      claim_text: "Climate change requires immediate government action",
      premises: [
        "Scientific consensus shows accelerating warming",
        "Market solutions have proven insufficient"
      ],
      worldview_analyses: {
        libertarian: {
          position: "oppose",
          reasoning: "Government mandates are inefficient and violate property rights. Innovation and market mechanisms, including carbon pricing without central planning, better address environmental concerns while preserving freedom.",
          key_assumptions: [
            "Property rights lead to environmental stewardship",
            "Innovation solves problems better than regulation",
            "Government action causes unintended consequences"
          ],
          consistency_scores: {
            premise_claim: 0.38,
            worldview_internal: 0.90
          },
          confidence: 0.85
        },
        religious_conservative: {
          position: "conditional",
          reasoning: "Stewardship of creation is a biblical mandate, but solutions must respect human dignity and economic freedom. Support environmental protection that doesn't impose secular ideology or harm human flourishing.",
          key_assumptions: [
            "Humans have stewardship responsibility",
            "Human welfare takes priority",
            "Environmental concern shouldn't become secular religion"
          ],
          consistency_scores: {
            premise_claim: 0.68,
            worldview_internal: 0.82
          },
          confidence: 0.75
        },
        eco_justice: {
          position: "support",
          reasoning: "Climate crisis demands urgent systemic change. Government must act decisively to regulate polluters, invest in green infrastructure, and ensure transition doesn't harm vulnerable communities. Environmental justice and social justice are inseparable.",
          key_assumptions: [
            "Climate crisis is existential threat",
            "Environmental harm disproportionately affects marginalized",
            "Systemic problems require structural solutions"
          ],
          consistency_scores: {
            premise_claim: 0.95,
            worldview_internal: 0.95
          },
          confidence: 0.92
        },
        populist_nationalist: {
          position: "conditional",
          reasoning: "Environmental protection is important but shouldn't sacrifice national economic interests to global agreements that let other nations pollute freely. Protect our environment and workers, reject unfair international constraints.",
          key_assumptions: [
            "National interest comes first",
            "International agreements often unfair",
            "Domestic environmental protection is important"
          ],
          consistency_scores: {
            premise_claim: 0.58,
            worldview_internal: 0.80
          },
          confidence: 0.78
        }
      }
    },
    {
      claim_id: "claim_3",
      claim_text: "Immigration increases economic prosperity",
      premises: [
        "Immigrants start businesses at higher rates",
        "Labor mobility increases economic efficiency"
      ],
      worldview_analyses: {
        libertarian: {
          position: "support",
          reasoning: "Free movement of labor is essential to free markets. Immigration restrictions are government interference that reduces economic efficiency and violates individual liberty. Open borders maximize prosperity through voluntary exchange.",
          key_assumptions: [
            "Free markets require free movement",
            "Voluntary exchange benefits all parties",
            "Government borders are artificial constraints"
          ],
          consistency_scores: {
            premise_claim: 0.88,
            worldview_internal: 0.93
          },
          confidence: 0.90
        },
        religious_conservative: {
          position: "conditional",
          reasoning: "Biblical hospitality commands welcoming the stranger, but nations have legitimate interests in security and cultural cohesion. Support legal immigration that respects rule of law and allows cultural integration.",
          key_assumptions: [
            "Hospitality is moral duty",
            "Cultural cohesion matters",
            "Rule of law must be respected"
          ],
          consistency_scores: {
            premise_claim: 0.55,
            worldview_internal: 0.75
          },
          confidence: 0.70
        },
        eco_justice: {
          position: "support",
          reasoning: "Migration is often driven by inequality, climate change, and injustice. Support immigrant rights and address root causes of forced migration. Borders reinforce global inequality and environmental destruction.",
          key_assumptions: [
            "Migration often result of systemic injustice",
            "Human rights transcend borders",
            "Global inequality requires global solutions"
          ],
          consistency_scores: {
            premise_claim: 0.72,
            worldview_internal: 0.87
          },
          confidence: 0.82
        },
        populist_nationalist: {
          position: "oppose",
          reasoning: "Mass immigration harms working citizens by depressing wages and straining services. National borders protect national interests. Prioritize citizens over global economic abstractions pushed by elites who don't bear the costs.",
          key_assumptions: [
            "National sovereignty is paramount",
            "Immigration harms working class",
            "Elites benefit while citizens suffer"
          ],
          consistency_scores: {
            premise_claim: 0.32,
            worldview_internal: 0.90
          },
          confidence: 0.88
        }
      }
    }
  ],
  divergence_analysis: [
    {
      claim_id: "claim_1",
      severity: "high",
      explanation: "The fundamental divergence stems from opposing views on the role of government and the source of prosperity. Libertarians prioritize individual freedom and market mechanisms, viewing UBI as coercive redistribution that undermines personal agency. Eco-Justice and Populist Nationalist advocates see UBI as correcting systemic inequalities, though from different perspectives—global justice vs national interest. Religious Conservatives are torn between caring for the poor and concerns about moral hazard.",
      value_conflicts: [
        {
          worldview1: "libertarian",
          worldview2: "eco_justice",
          conflicting_value1: "Individual Liberty",
          conflicting_value2: "Economic Justice"
        },
        {
          worldview1: "libertarian",
          worldview2: "populist_nationalist",
          conflicting_value1: "Free Market Principle",
          conflicting_value2: "National Economic Protection"
        }
      ],
      assumption_conflicts: [
        "Role of government in ensuring welfare",
        "Definition of freedom (negative vs positive liberty)",
        "Source of economic prosperity",
        "Nature of individual vs collective responsibility"
      ]
    },
    {
      claim_id: "claim_2",
      severity: "high",
      explanation: "Climate action reveals deep divisions about authority, science, and priorities. Libertarians resist government mandates on principle. Religious Conservatives balance stewardship with skepticism of secular environmentalism. Eco-Justice views climate as existential crisis requiring radical action. Populist Nationalists worry international agreements harm national interests while benefiting rivals.",
      value_conflicts: [
        {
          worldview1: "eco_justice",
          worldview2: "libertarian",
          conflicting_value1: "Collective Environmental Action",
          conflicting_value2: "Individual Freedom"
        },
        {
          worldview1: "eco_justice",
          worldview2: "populist_nationalist",
          conflicting_value1: "Global Climate Justice",
          conflicting_value2: "National Economic Sovereignty"
        }
      ],
      assumption_conflicts: [
        "Urgency and severity of climate threat",
        "Efficacy of market vs government solutions",
        "Legitimacy of international agreements",
        "Priority of environmental vs economic concerns"
      ]
    },
    {
      claim_id: "claim_3",
      severity: "high",
      explanation: "Immigration creates the starkest divide, pitting Libertarian free market principles and Eco-Justice humanitarian concerns against Populist Nationalist emphasis on national sovereignty and citizen priority. Religious Conservatives occupy uncomfortable middle ground between hospitality and order. This reveals fundamentally different conceptions of community, belonging, and obligation.",
      value_conflicts: [
        {
          worldview1: "libertarian",
          worldview2: "populist_nationalist",
          conflicting_value1: "Free Movement",
          conflicting_value2: "National Sovereignty"
        },
        {
          worldview1: "eco_justice",
          worldview2: "populist_nationalist",
          conflicting_value1: "Universal Human Rights",
          conflicting_value2: "Citizen Priority"
        }
      ],
      assumption_conflicts: [
        "Economic effects of immigration",
        "Legitimacy and meaning of national borders",
        "Nature of community and obligation",
        "Cultural cohesion vs diversity"
      ]
    }
  ]
};
