"""
Metis Quiz Data - All quiz definitions with gamified challenge types.
"""

QUIZZES = {
    "ai-fundamentals": {
        "id": "ai-fundamentals",
        "title": "AI Fundamentals",
        "description": "Test your core knowledge of how AI and machine learning systems work.",
        "category": "AI Knowledge",
        "difficulty": "Beginner",
        "xp_reward": 200,
        "time_estimate": "10 min",
        "min_level": 1,
        "questions": [
            {
                "id": "af-1",
                "question": "What does 'LLM' stand for in the context of modern AI?",
                "options": [
                    "Large Language Model",
                    "Low-Level Machine",
                    "Layered Learning Module",
                    "Logical Language Matrix"
                ],
                "correct_index": 0,
                "explanation": "LLM stands for Large Language Model - the architecture powering tools like ChatGPT, Claude, and Gemini.",
                "type": "multiple_choice"
            },
            {
                "id": "af-2",
                "question": "Which of the following best describes 'hallucination' in an AI context?",
                "options": [
                    "The AI generating visual illusions",
                    "The AI producing confident but factually incorrect information",
                    "The AI running too slowly due to overload",
                    "The AI refusing to answer a question"
                ],
                "correct_index": 1,
                "explanation": "AI hallucination refers to the model generating plausible-sounding but false information with apparent confidence. This is a key risk in regulated industries.",
                "type": "multiple_choice"
            },
            {
                "id": "af-3",
                "question": "SPOT THE HALLUCINATION: An AI assistant responds: 'The EMA approved semaglutide for obesity in adults in 2021, based on the SUSTAIN-7 trial which showed a 20% weight reduction at 52 weeks.' What is wrong?",
                "options": [
                    "Semaglutide was never approved for obesity by the EMA",
                    "The SUSTAIN-7 trial was a T2D cardiovascular outcomes trial, not an obesity weight study - wrong trial cited",
                    "EMA approvals are never given in 2021",
                    "Nothing is wrong - this is accurate"
                ],
                "correct_index": 1,
                "explanation": "SUSTAIN-7 compared semaglutide to dulaglutide in T2D patients - it was not an obesity weight reduction trial. The AI has confidently cited the wrong trial. Always verify trial names and outcomes.",
                "type": "spot_hallucination"
            },
            {
                "id": "af-4",
                "question": "What is 'training data' in machine learning?",
                "options": [
                    "Instructions given to the AI during a conversation",
                    "The dataset used to teach the model patterns during development",
                    "The user manual for an AI tool",
                    "The hardware specifications of the AI server"
                ],
                "correct_index": 1,
                "explanation": "Training data is the large dataset the model learns from during development. This shapes what the model knows and can do.",
                "type": "multiple_choice"
            },
            {
                "id": "af-5",
                "question": "What does 'context window' refer to in large language models?",
                "options": [
                    "The graphical interface size of the AI application",
                    "The maximum amount of text the model can process in one interaction",
                    "The number of users who can access the AI simultaneously",
                    "The time limit for AI responses"
                ],
                "correct_index": 1,
                "explanation": "The context window is the maximum amount of text (measured in tokens) that the model can consider at one time. Larger context windows allow longer documents to be processed.",
                "type": "multiple_choice"
            },
            {
                "id": "af-6",
                "question": "Which term describes teaching an AI model to improve on a specific task using a smaller, targeted dataset after initial training?",
                "options": [
                    "Pre-training",
                    "Fine-tuning",
                    "Prompt injection",
                    "Data augmentation"
                ],
                "correct_index": 1,
                "explanation": "Fine-tuning adapts a pre-trained model to a specific domain or task using a smaller, curated dataset - for example, fine-tuning on clinical notes.",
                "type": "multiple_choice"
            },
            {
                "id": "af-7",
                "question": "What is a 'token' in the context of AI language models?",
                "options": [
                    "A security password for API access",
                    "A unit of text (roughly 3-4 characters or 0.75 words) that models process",
                    "A payment unit for using AI services",
                    "A binary digit processed by the neural network"
                ],
                "correct_index": 1,
                "explanation": "Tokens are the basic units LLMs process - roughly 3-4 characters each. 1000 tokens ~ 750 words. Pricing and context limits are measured in tokens.",
                "type": "multiple_choice"
            },
            {
                "id": "af-8",
                "question": "WHICH TOOL? You need to quickly summarise 50 research abstracts to identify the most relevant ones for a systematic literature review. Which approach is most appropriate?",
                "options": [
                    "Manually read all 50 abstracts",
                    "Use an AI tool like Elicit or Consensus designed for literature screening",
                    "Ask a colleague to summarise them",
                    "Use CTRL+F to search for keywords only"
                ],
                "correct_index": 1,
                "explanation": "Tools like Elicit and Consensus are purpose-built for literature review tasks - they can screen, summarise and extract data from abstracts at scale with citation tracking.",
                "type": "which_tool"
            },
            {
                "id": "af-9",
                "question": "What is 'RAG' (Retrieval-Augmented Generation) used for?",
                "options": [
                    "Removing unwanted content from AI outputs",
                    "Connecting AI models to external knowledge sources so responses are grounded in real documents",
                    "A type of adversarial attack on AI systems",
                    "Rating AI-generated content for quality"
                ],
                "correct_index": 1,
                "explanation": "RAG connects an LLM to a document database - the AI retrieves relevant chunks before generating a response, grounding answers in actual source material and reducing hallucination.",
                "type": "multiple_choice"
            },
            {
                "id": "af-10",
                "question": "When an AI model is described as 'multimodal', what does this mean?",
                "options": [
                    "It can run in multiple languages simultaneously",
                    "It can process and generate multiple types of content (text, images, audio, etc.)",
                    "It has multiple safety filters installed",
                    "It can be accessed through multiple interfaces"
                ],
                "correct_index": 1,
                "explanation": "Multimodal models can handle different data types - for example, GPT-4o can accept both text and images as inputs and generate text responses about them.",
                "type": "multiple_choice"
            }
        ]
    },

    "prompt-engineering": {
        "id": "prompt-engineering",
        "title": "Prompt Engineering",
        "description": "Master the art of crafting effective prompts to get the best results from AI tools.",
        "category": "AI Skills",
        "difficulty": "Intermediate",
        "xp_reward": 300,
        "time_estimate": "15 min",
        "min_level": 1,
        "questions": [
            {
                "id": "pe-1",
                "question": "BEST PROMPT: You need to summarise a clinical study report executive summary in plain language for patients. Which prompt is most effective?",
                "options": [
                    "Summarise this",
                    "Make this simpler",
                    "You are a medical writer creating patient-friendly content. Summarise the following executive summary in plain English (reading age 10), in 150 words, focusing on: what the study tested, what was found, and what it means for patients. Avoid all jargon.",
                    "Rewrite this for patients please"
                ],
                "correct_index": 2,
                "explanation": "Effective prompts assign a role, specify format constraints, define the audience, specify length, and call out exactly what to focus on. Vague prompts produce vague outputs.",
                "type": "best_prompt"
            },
            {
                "id": "pe-2",
                "question": "What does 'few-shot prompting' mean?",
                "options": [
                    "Using a very short prompt to save tokens",
                    "Providing the AI with 1-3 examples of the desired output format within the prompt",
                    "Running the same prompt multiple times to get better results",
                    "Limiting the AI to short responses"
                ],
                "correct_index": 1,
                "explanation": "Few-shot prompting includes examples of the format/style you want. E.g., showing 2 examples of an adverse event narrative before asking the AI to write a new one dramatically improves consistency.",
                "type": "multiple_choice"
            },
            {
                "id": "pe-3",
                "question": "BEST PROMPT: You want to extract all adverse events from a clinical narrative. Which prompt is best?",
                "options": [
                    "Find the adverse events",
                    "Extract adverse events from this text. Output as a JSON array with fields: event_term (MedDRA preferred term), onset_date, severity (mild/moderate/severe), outcome, and whether it was serious (SAE: yes/no). If a field is unknown, write null.",
                    "What happened in this patient case?",
                    "List the bad things that happened to the patient"
                ],
                "correct_index": 1,
                "explanation": "Structured extraction prompts should specify the exact output format, field names, controlled vocabularies (like MedDRA), and how to handle missing data - this enables reliable downstream processing.",
                "type": "best_prompt"
            },
            {
                "id": "pe-4",
                "question": "What is a 'system prompt' in AI tools like ChatGPT or Claude?",
                "options": [
                    "The first message you type in a new conversation",
                    "An instruction that sets the AI's persona, constraints, and behaviour for the entire session",
                    "A prompt generated automatically by the system",
                    "A prompt that triggers system-level AI functions"
                ],
                "correct_index": 1,
                "explanation": "System prompts (often set by enterprise admins) define the AI's role, tone, restrictions, and context persistently throughout a conversation - like briefing a new employee before they start work.",
                "type": "multiple_choice"
            },
            {
                "id": "pe-5",
                "question": "Which technique asks the AI to explain its reasoning step-by-step before giving a final answer?",
                "options": [
                    "Zero-shot prompting",
                    "Chain-of-thought prompting",
                    "Role prompting",
                    "Output anchoring"
                ],
                "correct_index": 1,
                "explanation": "Chain-of-thought prompting (e.g., 'Think step by step') encourages the model to work through a problem logically, which significantly improves accuracy on complex reasoning tasks.",
                "type": "multiple_choice"
            },
            {
                "id": "pe-6",
                "question": "BEST PROMPT: You need an AI to review a regulatory document for consistency issues. Which prompt is most effective?",
                "options": [
                    "Check this document",
                    "Review the following regulatory document and identify: (1) any inconsistencies in drug dosing mentioned, (2) contradictions between sections, (3) undefined abbreviations used before definition. Format your findings as a numbered list with the specific location (section/page) and description of each issue.",
                    "Is this document okay?",
                    "Find any mistakes in this regulatory document"
                ],
                "correct_index": 1,
                "explanation": "Quality review prompts should enumerate exactly what to look for, specify what to report, and define the output format. Vague review prompts miss specific issues.",
                "type": "best_prompt"
            },
            {
                "id": "pe-7",
                "question": "What is 'prompt injection' and why should you be aware of it?",
                "options": [
                    "Adding extra context to improve AI responses",
                    "A malicious technique where hidden instructions in user inputs try to override system prompts or manipulate AI behaviour",
                    "Injecting code into AI APIs to improve performance",
                    "A technique for improving AI memory"
                ],
                "correct_index": 1,
                "explanation": "Prompt injection is a security risk where malicious text (e.g., in pasted documents) contains hidden instructions to the AI. Always be cautious when feeding AI with external/untrusted content.",
                "type": "multiple_choice"
            },
            {
                "id": "pe-8",
                "question": "Which of the following is the most complete 'role + context + task + format' structured prompt?",
                "options": [
                    "Write a summary",
                    "As a senior medical writer (role), given this CSR executive summary for a Phase 3 COPD trial (context), write a 200-word plain language summary (task) formatted as three short paragraphs: purpose, results, conclusion (format)",
                    "Summarise this medical report for a patient",
                    "You are an AI. Write something about this trial."
                ],
                "correct_index": 1,
                "explanation": "The best prompts explicitly include: Role, Context, Task, and Format (RCTF framework). This maximises the relevance and quality of the AI output.",
                "type": "best_prompt"
            },
            {
                "id": "pe-9",
                "question": "SCENARIO: An AI produces a summary that misses key safety findings. What should you do first?",
                "options": [
                    "Accept the output - AI is usually right",
                    "Switch to a different AI tool",
                    "Refine your prompt to explicitly request inclusion of safety findings, then verify the new output against the source document",
                    "Report the AI tool as broken"
                ],
                "correct_index": 2,
                "explanation": "Iterative prompt refinement is normal. If output misses something important, add explicit instruction to include it, then always verify AI outputs against source material for safety-critical content.",
                "type": "scenario"
            },
            {
                "id": "pe-10",
                "question": "What is the purpose of setting 'temperature' in an AI model?",
                "options": [
                    "Controls the AI's processing speed",
                    "Controls randomness/creativity - low temperature gives consistent outputs, high temperature gives more varied/creative outputs",
                    "Sets the server temperature for optimal AI performance",
                    "Determines how long the AI thinks before responding"
                ],
                "correct_index": 1,
                "explanation": "Temperature (0-2) controls output randomness. Use low temperature (0.1-0.3) for factual extraction tasks needing consistency. Higher temperature for creative brainstorming.",
                "type": "multiple_choice"
            },
            {
                "id": "pe-11",
                "question": "BEST PROMPT: You need an AI to translate a clinical document into French while preserving technical terminology. Which is best?",
                "options": [
                    "Translate to French",
                    "Translate the following clinical document into French. Preserve all medical terminology in their accepted French equivalents (do not translate brand names). Maintain the original paragraph structure. If any term has no direct French equivalent, keep it in English and add (English term) in brackets.",
                    "Make this French please",
                    "Convert this to the French language"
                ],
                "correct_index": 1,
                "explanation": "Translation prompts for regulated documents must specify: target language, terminology handling, structure preservation, and edge case behaviour (e.g., untranslatable terms).",
                "type": "best_prompt"
            },
            {
                "id": "pe-12",
                "question": "What does 'grounding' mean when using AI for factual tasks?",
                "options": [
                    "Connecting the AI to the internet",
                    "Anchoring AI outputs to verified source documents - asking it to cite page/section references or only use provided materials",
                    "Reducing the AI's response length",
                    "Training the AI on real-world data"
                ],
                "correct_index": 1,
                "explanation": "Grounding means constraining the AI to draw only from provided sources. Prompts like 'Answer using only the attached document. Cite the section for each claim' dramatically reduce hallucination risk.",
                "type": "multiple_choice"
            }
        ]
    },

    "ai-ethics": {
        "id": "ai-ethics",
        "title": "AI Ethics & Safety",
        "description": "Navigate the ethical landscape of AI in healthcare and regulated industries.",
        "category": "Governance",
        "difficulty": "Intermediate",
        "xp_reward": 250,
        "time_estimate": "15 min",
        "min_level": 1,
        "questions": [
            {
                "id": "ae-1",
                "question": "ETHICS CHECK: A colleague pastes an identified patient narrative (with name, DOB, hospital ID) into ChatGPT to ask for a medical writing suggestion. What is the correct action?",
                "options": [
                    "This is fine as long as you delete the chat history afterwards",
                    "This is a potential GDPR breach - patient identifiers must be anonymised or pseudonymised before being input into any external AI tool",
                    "This is fine if you have a ChatGPT Enterprise account",
                    "Only the patient needs to consent to this"
                ],
                "correct_index": 1,
                "explanation": "Inputting identifiable patient data into external AI tools (including Enterprise ChatGPT) without explicit data processing agreements and anonymisation is a GDPR violation. Always anonymise before AI processing.",
                "type": "ethics_check"
            },
            {
                "id": "ae-2",
                "question": "What is 'algorithmic bias' in AI systems?",
                "options": [
                    "When an AI runs slowly due to algorithm inefficiency",
                    "When an AI system produces systematically unfair or skewed outputs due to biases in training data or model design",
                    "When users deliberately bias their prompts",
                    "A technical error in the AI's mathematical calculations"
                ],
                "correct_index": 1,
                "explanation": "Algorithmic bias occurs when AI systems reflect and amplify biases present in training data. In healthcare, this can lead to disparate treatment recommendations across demographic groups.",
                "type": "multiple_choice"
            },
            {
                "id": "ae-3",
                "question": "ETHICS CHECK: Your team wants to use an AI tool to auto-generate adverse event narratives for a regulatory submission without human review. Is this appropriate?",
                "options": [
                    "Yes, AI is more consistent than humans",
                    "No - regulatory submissions require qualified human oversight of all content; AI can assist drafting but cannot be the sole author of regulated documents",
                    "Yes, if the AI was trained on clinical data",
                    "Only if it is approved by the FDA"
                ],
                "correct_index": 1,
                "explanation": "AI can accelerate drafting but regulatory documents (adverse event narratives, CSRs, labels) require qualified human review and authorship accountability. AI as sole author of regulated content is not currently acceptable.",
                "type": "ethics_check"
            },
            {
                "id": "ae-4",
                "question": "Which principle means AI systems should be able to explain why they made a particular decision or generated specific output?",
                "options": [
                    "Scalability",
                    "Explainability / Interpretability",
                    "Efficiency",
                    "Automation"
                ],
                "correct_index": 1,
                "explanation": "Explainability (or interpretability) is a core AI ethics principle - especially critical in healthcare where clinicians and regulators must understand why an AI made a recommendation.",
                "type": "multiple_choice"
            },
            {
                "id": "ae-5",
                "question": "Under the EU AI Act (2024), how are most AI writing assistance tools for regulatory/medical use classified?",
                "options": [
                    "Prohibited AI",
                    "High-risk AI requiring conformity assessment",
                    "Limited risk or minimal risk requiring transparency measures",
                    "Exempt from regulation"
                ],
                "correct_index": 2,
                "explanation": "Most AI writing tools fall under limited/minimal risk under the EU AI Act. However, AI used in medical device decision-making or clinical diagnosis may be classified as high-risk.",
                "type": "multiple_choice"
            },
            {
                "id": "ae-6",
                "question": "ETHICS CHECK: You are writing a publication and used AI to help draft the discussion section. What must you do?",
                "options": [
                    "Nothing - AI usage does not need to be disclosed",
                    "Disclose AI use in the methods/acknowledgements section and ensure a human author takes full responsibility for the content's accuracy",
                    "List the AI as a co-author",
                    "Only disclose if the journal specifically asks"
                ],
                "correct_index": 1,
                "explanation": "Most major journals (ICMJE, Lancet, BMJ, NEJM) now require disclosure of AI use in manuscript preparation. AI cannot be listed as an author. Human authors remain fully accountable for all content.",
                "type": "ethics_check"
            },
            {
                "id": "ae-7",
                "question": "What does 'data minimisation' mean in the context of using AI tools?",
                "options": [
                    "Using the smallest possible AI model",
                    "Only providing AI tools with the minimum personal data necessary for the task",
                    "Compressing data files before uploading to AI tools",
                    "Reducing the size of AI training datasets"
                ],
                "correct_index": 1,
                "explanation": "Data minimisation is a GDPR principle - you should only share with AI tools the minimum data necessary for the task. Strip unnecessary personal identifiers before AI processing.",
                "type": "multiple_choice"
            },
            {
                "id": "ae-8",
                "question": "ETHICS CHECK: An AI tool produces a summary that contains a subtle factual error about a drug's safety profile. You notice it but your deadline is tight. What should you do?",
                "options": [
                    "Submit it - small errors are acceptable in drafts",
                    "Correct the error before submission, regardless of deadline pressure - patient safety and regulatory accuracy are non-negotiable",
                    "Flag it in your email and let the reviewer catch it",
                    "Delete that section from the document"
                ],
                "correct_index": 1,
                "explanation": "In regulated industries, factual errors about safety data are never acceptable shortcuts. AI-generated errors must be caught and corrected before submission. This is why human oversight of AI outputs is mandatory.",
                "type": "ethics_check"
            },
            {
                "id": "ae-9",
                "question": "Which of the following best describes 'responsible AI' in a clinical communications context?",
                "options": [
                    "Using AI only for administrative tasks",
                    "AI that is accurate, fair, transparent, safe, and used with appropriate human oversight - especially for patient-facing or regulatory content",
                    "Not using AI for anything important",
                    "Using AI tools that have received FDA approval"
                ],
                "correct_index": 1,
                "explanation": "Responsible AI combines multiple principles: accuracy (reduces hallucination risk), fairness (avoids bias), transparency (discloses AI use), safety (protects patient data), and oversight (human review).",
                "type": "multiple_choice"
            },
            {
                "id": "ae-10",
                "question": "ETHICS CHECK: Your company has approved ChatGPT Enterprise for internal use. A client sends you confidential pre-approval drug data to summarise. Can you use ChatGPT Enterprise?",
                "options": [
                    "Yes - enterprise tools are always safe for confidential data",
                    "Only if you check the company AI policy and client confidentiality agreement first - many client contracts prohibit third-party AI processing of their data",
                    "Yes - ChatGPT Enterprise has HIPAA compliance",
                    "Yes - enterprise accounts automatically comply with NDAs"
                ],
                "correct_index": 1,
                "explanation": "Client confidentiality agreements often explicitly prohibit processing their data through third-party AI tools, regardless of enterprise tier. Always check both the company AI policy and the specific client NDA/contract.",
                "type": "ethics_check"
            },
            {
                "id": "ae-11",
                "question": "What is 'model drift' and why does it matter in healthcare AI?",
                "options": [
                    "When an AI model moves between servers",
                    "When an AI model's performance degrades over time as real-world data patterns change from training data",
                    "When users change their prompting style",
                    "When an AI vendor updates their pricing"
                ],
                "correct_index": 1,
                "explanation": "Model drift occurs when real-world data diverges from training data - an AI trained on 2022 clinical guidelines may give outdated recommendations in 2025. Continuous monitoring and revalidation is critical in healthcare.",
                "type": "multiple_choice"
            },
            {
                "id": "ae-12",
                "question": "SCENARIO: You discover that an AI tool your department uses has been trained on public clinical trial data including some that was not properly anonymised. What is the correct escalation path?",
                "options": [
                    "Keep using it if the outputs seem fine",
                    "Report to your Information Governance/DPO immediately and suspend use of the tool pending investigation",
                    "Contact the AI vendor directly and keep using the tool",
                    "Anonymise your inputs going forward and continue"
                ],
                "correct_index": 1,
                "explanation": "Data governance breaches involving patient data must be escalated to the Data Protection Officer (DPO) immediately. Use of the tool should be suspended pending a formal investigation under GDPR Article 33.",
                "type": "scenario"
            }
        ]
    },

    "data-literacy": {
        "id": "data-literacy",
        "title": "Data Literacy for AI",
        "description": "Understand data concepts that underpin effective AI use.",
        "category": "Foundations",
        "difficulty": "Beginner",
        "xp_reward": 200,
        "time_estimate": "10 min",
        "min_level": 1,
        "questions": [
            {
                "id": "dl-1",
                "question": "What is a 'structured' dataset?",
                "options": [
                    "A dataset stored in a specially reinforced server",
                    "Data organised in rows and columns with defined data types (like a spreadsheet or database table)",
                    "A dataset with no missing values",
                    "Any dataset that has been reviewed by a data manager"
                ],
                "correct_index": 1,
                "explanation": "Structured data has a fixed schema - rows and columns with defined types (numbers, dates, text). Clinical databases, SDTM datasets, and CRF data are typically structured. AI handles this differently from unstructured text.",
                "type": "multiple_choice"
            },
            {
                "id": "dl-2",
                "question": "What does 'missing at random' (MAR) mean in clinical trial data?",
                "options": [
                    "Data that was accidentally deleted",
                    "Missing data whose absence is related to other observed variables but not to the missing value itself",
                    "Data that is randomly selected to be excluded from analysis",
                    "Data collected at random timepoints"
                ],
                "correct_index": 1,
                "explanation": "MAR means the probability of missingness depends on other observed data (e.g., sicker patients more likely to drop out and have missing labs). This matters for imputation strategies in AI/ML models.",
                "type": "multiple_choice"
            },
            {
                "id": "dl-3",
                "question": "SPOT THE ISSUE: An AI model trained to predict patient readmission achieves 95% accuracy on the training dataset but only 62% on new hospital data. What is this called?",
                "options": [
                    "Model success",
                    "Underfitting",
                    "Overfitting - the model memorised training data rather than learning generalisable patterns",
                    "Data contamination"
                ],
                "correct_index": 2,
                "explanation": "Overfitting occurs when a model learns noise/specifics of training data rather than true patterns. It performs brilliantly on training data but poorly on new data - a critical problem in healthcare AI validation.",
                "type": "spot_hallucination"
            },
            {
                "id": "dl-4",
                "question": "What is 'data normalisation' in the context of preparing data for AI?",
                "options": [
                    "Ensuring data complies with GDPR",
                    "Scaling numerical data to a standard range (e.g., 0-1) so different variables can be fairly compared by the model",
                    "Removing outliers from a dataset",
                    "Converting all data to the same file format"
                ],
                "correct_index": 1,
                "explanation": "Normalisation scales features to comparable ranges. Without it, a variable like 'age (18-90)' would numerically dominate a variable like 'binary sex (0-1)', leading to biased model training.",
                "type": "multiple_choice"
            },
            {
                "id": "dl-5",
                "question": "What does 'GIGO' stand for and why is it relevant to AI?",
                "options": [
                    "Graphics In, Graphics Out - relates to AI image generation",
                    "Garbage In, Garbage Out - AI models trained on poor quality data produce poor quality outputs",
                    "Generated Intelligence from Generic Operations",
                    "Global Input, Global Output - relating to cloud AI processing"
                ],
                "correct_index": 1,
                "explanation": "GIGO is a fundamental principle: no matter how sophisticated the AI algorithm, poor quality input data produces unreliable outputs. Data quality is the foundation of trustworthy AI.",
                "type": "multiple_choice"
            },
            {
                "id": "dl-6",
                "question": "In statistics, what is the difference between 'correlation' and 'causation'?",
                "options": [
                    "There is no difference",
                    "Correlation means two variables move together; causation means one variable directly causes change in another - AI can identify correlations but cannot prove causation",
                    "Causation is stronger correlation",
                    "Correlation applies to continuous data, causation applies to categorical data"
                ],
                "correct_index": 1,
                "explanation": "A critical data literacy concept: AI models find correlations in data, but correlation does not imply causation. E.g., ice cream sales correlate with drowning rates (both increase in summer) - ice cream does not cause drowning.",
                "type": "multiple_choice"
            },
            {
                "id": "dl-7",
                "question": "WHICH TOOL? You have a 10,000-row clinical dataset in Excel with missing values, outliers, and inconsistent date formats. You need to clean it before AI analysis. What should you use first?",
                "options": [
                    "ChatGPT",
                    "Excel/Python pandas for structured data cleaning - validating types, standardising formats, handling missing values",
                    "BioRender",
                    "A web search engine"
                ],
                "correct_index": 1,
                "explanation": "Structured data cleaning is best done with tools like Excel, Python (pandas), or R before feeding to AI. ChatGPT can assist with the code but isn't a data cleaning tool itself.",
                "type": "which_tool"
            },
            {
                "id": "dl-8",
                "question": "What is a 'confidence interval' and why does it matter when interpreting AI predictions?",
                "options": [
                    "How confident the AI is in its response",
                    "A statistical range that contains the true population parameter with a specified probability (e.g., 95% CI) - indicates precision and uncertainty around estimates",
                    "The percentage of data used for training",
                    "A measure of how fast the AI responds"
                ],
                "correct_index": 1,
                "explanation": "Confidence intervals quantify uncertainty. A 95% CI of [1.2-8.7] for an odds ratio is much wider (less precise) than [3.1-3.8]. Understanding uncertainty is essential for interpreting AI-generated statistical claims.",
                "type": "multiple_choice"
            },
            {
                "id": "dl-9",
                "question": "SPOT THE ISSUE: An AI tool reports 'The study shows that the new drug significantly reduces mortality (p=0.049, HR=0.98, 95% CI: 0.96-1.00).' What should concern you?",
                "options": [
                    "Nothing - p<0.05 means it's significant",
                    "The hazard ratio of 0.98 with a CI touching 1.00 suggests the effect is borderline and clinically tiny despite statistical significance - the AI is overemphasising 'significance'",
                    "The p-value should be lower",
                    "The HR should be above 1.0 to show improvement"
                ],
                "correct_index": 1,
                "explanation": "Statistical significance does not equal clinical meaningfulness. HR=0.98 means 2% mortality reduction. A CI touching 1.0 means the true effect could be zero. Always assess effect size and clinical relevance, not just p-values.",
                "type": "spot_hallucination"
            },
            {
                "id": "dl-10",
                "question": "What is 'synthetic data' and when is it useful for AI in healthcare?",
                "options": [
                    "Data generated by artificial intelligence about synthetic materials",
                    "Artificially generated data that mimics the statistical properties of real patient data - useful for AI training/testing when real patient data cannot be shared due to privacy concerns",
                    "Data stored in synthetic (non-natural) database formats",
                    "Low-quality fake data used to test AI systems"
                ],
                "correct_index": 1,
                "explanation": "Synthetic data is algorithmically generated to match real data distributions without containing real patient records. It enables AI development and testing while protecting patient privacy.",
                "type": "multiple_choice"
            }
        ]
    },

    "ai-tools-proficiency": {
        "id": "ai-tools-proficiency",
        "title": "AI Tools Proficiency",
        "description": "Master the AI tools used across the business - from writing assistants to research tools.",
        "category": "Tools",
        "difficulty": "Advanced",
        "xp_reward": 300,
        "time_estimate": "20 min",
        "min_level": 1,
        "questions": [
            {
                "id": "atp-1",
                "question": "WHICH TOOL? You need to rapidly screen 200 abstracts for a systematic literature review on a specific drug class. Which tool is most appropriate?",
                "options": [
                    "ChatGPT - paste all 200 abstracts",
                    "Elicit or Rayyan - purpose-built AI literature screening tools with PRISMA workflow support",
                    "BioRender",
                    "DeepL"
                ],
                "correct_index": 1,
                "explanation": "Elicit and Rayyan are purpose-built for systematic literature review - they support PICO framework, abstract screening workflows, and data extraction tables at scale.",
                "type": "which_tool"
            },
            {
                "id": "atp-2",
                "question": "What is Perplexity AI primarily used for compared to ChatGPT?",
                "options": [
                    "Image generation",
                    "Real-time web search with cited sources - better for finding current information with references vs ChatGPT's knowledge cutoff",
                    "Code generation only",
                    "Video creation"
                ],
                "correct_index": 1,
                "explanation": "Perplexity specialises in web search with source citations - ideal for checking current guidelines, recent publications, or news. ChatGPT has a training cutoff and is better for drafting/reasoning tasks.",
                "type": "multiple_choice"
            },
            {
                "id": "atp-3",
                "question": "WHICH TOOL? A medical illustrator needs to create a high-quality mechanism of action (MOA) diagram for a journal submission. Which tool is most appropriate?",
                "options": [
                    "ChatGPT",
                    "Midjourney",
                    "BioRender - purpose-built scientific illustration tool with pre-licensed biological figures",
                    "Canva"
                ],
                "correct_index": 2,
                "explanation": "BioRender provides publication-ready, pre-licensed biological illustrations. Unlike general image AI tools, BioRender outputs meet journal figure requirements and include usage licences.",
                "type": "which_tool"
            },
            {
                "id": "atp-4",
                "question": "What does Grammarly's AI do differently from ChatGPT for document editing?",
                "options": [
                    "Nothing - they do the same thing",
                    "Grammarly focuses on in-line grammar, tone, clarity and style suggestions within your document workflow; ChatGPT requires copy-pasting and full prompt crafting",
                    "Grammarly can translate documents",
                    "ChatGPT is better at grammar than Grammarly"
                ],
                "correct_index": 1,
                "explanation": "Grammarly integrates directly into Word, Outlook, browsers - providing real-time suggestions. ChatGPT requires intentional prompting. Different tools for different workflow stages.",
                "type": "multiple_choice"
            },
            {
                "id": "atp-5",
                "question": "WHICH TOOL? Your team needs to transcribe a 2-hour client advisory board meeting recording and identify key action items. Which combination is best?",
                "options": [
                    "Manually transcribe it",
                    "Otter.ai or Teams transcription for the transcript, then Claude/ChatGPT to identify and summarise action items from the transcript",
                    "BioRender and DeepL",
                    "Grammarly and Perplexity"
                ],
                "correct_index": 1,
                "explanation": "Otter.ai / Teams AI Meeting Notes handle transcription, then an LLM can efficiently extract and structure action items from the transcript text. Combining specialist tools gives the best result.",
                "type": "which_tool"
            },
            {
                "id": "atp-6",
                "question": "What is Consensus used for in research workflows?",
                "options": [
                    "Team collaboration and meeting consensus",
                    "AI-powered search of peer-reviewed research papers - gives consensus meter showing whether evidence supports/refutes a claim",
                    "Regulatory consensus documents",
                    "Patient consensus surveys"
                ],
                "correct_index": 1,
                "explanation": "Consensus searches millions of peer-reviewed papers and provides a 'consensus meter' indicating whether scientific literature supports a claim - useful for rapid evidence queries in medical writing.",
                "type": "multiple_choice"
            },
            {
                "id": "atp-7",
                "question": "SPOT THE MISUSE: A medical writer uses DALL-E to generate images for a regulatory submission showing a drug's molecular structure. What is wrong?",
                "options": [
                    "Nothing - AI images are fine for regulatory documents",
                    "DALL-E is a creative image generator, not a scientific visualisation tool. Molecular structures in regulatory documents must be chemically accurate and generated using validated chemical drawing software (e.g., ChemDraw)",
                    "The image resolution may be too low",
                    "Only GPT-4 can generate regulatory images"
                ],
                "correct_index": 1,
                "explanation": "DALL-E generates aesthetically plausible but not chemically accurate structures. Regulatory submissions require precisely drawn structures from validated tools like ChemDraw or MarvinSketch.",
                "type": "spot_hallucination"
            },
            {
                "id": "atp-8",
                "question": "What is Claude (Anthropic) particularly noted for compared to GPT-4?",
                "options": [
                    "Better image generation",
                    "Longer context window (up to 200K tokens) and strong performance on long document analysis and coding tasks",
                    "Faster response speeds",
                    "Better at short social media posts"
                ],
                "correct_index": 1,
                "explanation": "Claude offers very large context windows (200K tokens = ~150,000 words) making it well-suited for processing long regulatory documents, CSRs, or full clinical study reports in a single session.",
                "type": "multiple_choice"
            },
            {
                "id": "atp-9",
                "question": "WHICH TOOL? You need to create an interactive slide deck for an advisory board presentation that includes dynamic data visualisations. Which AI tool helps most?",
                "options": [
                    "ChatGPT for text, then PowerPoint manually",
                    "Gamma.app or Beautiful.ai - AI presentation tools that generate structured slides with layouts, or Copilot in PowerPoint",
                    "Grammarly",
                    "Otter.ai"
                ],
                "correct_index": 1,
                "explanation": "Gamma.app, Beautiful.ai, and Microsoft Copilot for PowerPoint can generate structured presentation decks from outlines. They handle layout, design, and slide structure automatically.",
                "type": "which_tool"
            },
            {
                "id": "atp-10",
                "question": "What is Copilot for Microsoft 365 and where does it differ from ChatGPT?",
                "options": [
                    "They are identical products",
                    "Copilot integrates directly into Word, Excel, Outlook, Teams and can access your organisational content (emails, documents, meetings) - ChatGPT has no access to your M365 environment",
                    "Copilot is only for coding",
                    "ChatGPT is more secure than Copilot"
                ],
                "correct_index": 1,
                "explanation": "M365 Copilot is deeply integrated with your work context - it can summarise your emails, draft documents based on your existing files, and search your SharePoint. ChatGPT is isolated from your organisational data.",
                "type": "multiple_choice"
            },
            {
                "id": "atp-11",
                "question": "SCENARIO: A team member wants to use Midjourney to generate patient-facing imagery for a disease awareness campaign. What should be checked first?",
                "options": [
                    "Nothing - AI images are always appropriate for healthcare",
                    "Midjourney's commercial licence terms, whether the imagery is medically accurate, company brand guidelines, and whether patient representatives were involved in content review",
                    "Only the image resolution",
                    "Whether the file format is compatible"
                ],
                "correct_index": 1,
                "explanation": "Healthcare imagery has specific requirements: commercial licence (Midjourney Pro required for commercial use), medical accuracy review, brand compliance, and ideally patient community involvement for disease awareness content.",
                "type": "scenario"
            },
            {
                "id": "atp-12",
                "question": "What is NotebookLM (Google) primarily used for?",
                "options": [
                    "Code generation",
                    "Creating an AI assistant grounded in specific documents you upload - ask questions, get summaries, identify connections across your source materials",
                    "Image generation",
                    "Email writing"
                ],
                "correct_index": 1,
                "explanation": "NotebookLM lets you upload documents and then chat with an AI that answers only from those specific sources with citations. Useful for: literature reviews, CSR analysis, policy document Q&A.",
                "type": "multiple_choice"
            },
            {
                "id": "atp-13",
                "question": "WHICH TOOL? You need to monitor for new publications on a specific drug in real-time and get email alerts when new papers are published. Which tool is best?",
                "options": [
                    "ChatGPT with daily prompts",
                    "PubMed email alerts / Google Scholar alerts - set up automated monitoring of search queries",
                    "Otter.ai",
                    "Grammarly"
                ],
                "correct_index": 1,
                "explanation": "PubMed and Google Scholar both offer automated alert systems for new publications matching search criteria. This is more reliable and timely than manually prompting an LLM which has a training cutoff.",
                "type": "which_tool"
            },
            {
                "id": "atp-14",
                "question": "What is the key advantage of using Elicit over a standard PubMed search?",
                "options": [
                    "Elicit has more papers than PubMed",
                    "Elicit uses AI to extract structured data (populations, interventions, outcomes) from papers automatically, enabling rapid data synthesis without reading each paper fully",
                    "Elicit is free and PubMed costs money",
                    "Elicit searches news articles"
                ],
                "correct_index": 1,
                "explanation": "Elicit's AI can automatically extract PICO elements, sample sizes, outcomes, and key findings from multiple papers simultaneously, dramatically accelerating evidence synthesis for SLRs and HTAs.",
                "type": "multiple_choice"
            },
            {
                "id": "atp-15",
                "question": "SCENARIO: Your enterprise ChatGPT account shows that a colleague's conversation containing confidential client strategy was accidentally shared in a team workspace. What is the first step?",
                "options": [
                    "Delete the conversation and say nothing",
                    "Report to IT/Information Security immediately, document the incident, and follow the company data incident response procedure",
                    "Ask the colleague to delete it",
                    "Inform the client directly without internal escalation"
                ],
                "correct_index": 1,
                "explanation": "Data incidents involving confidential information must follow formal incident response procedures. IT/InfoSec must be notified to investigate scope, assess risk, and determine if external notification obligations apply.",
                "type": "scenario"
            }
        ]
    },

    "building-ai-workflows": {
        "id": "building-ai-workflows",
        "title": "Building AI Workflows",
        "description": "Advanced: Design and implement multi-step AI workflows for complex tasks.",
        "category": "Advanced Practice",
        "difficulty": "Advanced",
        "xp_reward": 400,
        "time_estimate": "25 min",
        "min_level": 10,
        "questions": [
            {
                "id": "baw-1",
                "question": "What is a 'pipeline' in AI workflow design?",
                "options": [
                    "A physical data cable connecting AI servers",
                    "A series of connected processing steps where the output of one step feeds as input to the next, automating multi-stage tasks",
                    "A queue of AI requests",
                    "The AI vendor's deployment process"
                ],
                "correct_index": 1,
                "explanation": "An AI pipeline chains tools/steps together: e.g., PDF ingestion → OCR → chunking → embedding → vector search → LLM generation → quality check. Each stage transforms data for the next.",
                "type": "multiple_choice"
            },
            {
                "id": "baw-2",
                "question": "SCENARIO: You are designing an AI workflow to process incoming clinical trial data listings and flag potential data anomalies. Which architecture is most appropriate?",
                "options": [
                    "A single ChatGPT prompt for the entire listing",
                    "A pipeline: structured validation rules → statistical anomaly detection → LLM interpretation of flagged items → human review queue with risk ranking",
                    "Send all listings to an AI and accept its outputs directly",
                    "Manual review only"
                ],
                "correct_index": 1,
                "explanation": "Complex data tasks benefit from layered architectures: deterministic rules catch obvious errors, statistical models find anomalies, LLMs provide interpretable explanations, and humans review high-risk flags.",
                "type": "scenario"
            },
            {
                "id": "baw-3",
                "question": "What is an 'AI agent' as opposed to a simple AI chatbot?",
                "options": [
                    "A human who manages AI tools",
                    "An AI system that can autonomously plan multi-step actions, use tools (search, code execution, file access), and work towards a goal with minimal human prompting at each step",
                    "A more expensive version of ChatGPT",
                    "An AI that works in the background without any user interaction"
                ],
                "correct_index": 1,
                "explanation": "AI agents can plan sequences of actions, use external tools, and autonomously execute multi-step tasks. E.g., an agent could: search PubMed → download papers → extract data → draft a summary - all from one instruction.",
                "type": "multiple_choice"
            },
            {
                "id": "baw-4",
                "question": "What is 'orchestration' in multi-agent AI systems?",
                "options": [
                    "The musical interface of AI tools",
                    "Coordinating multiple AI agents or tools, routing tasks to the right specialist agent and combining their outputs into a coherent result",
                    "Managing user access to AI tools",
                    "Scheduling AI processing jobs"
                ],
                "correct_index": 1,
                "explanation": "Orchestration manages the flow between multiple agents - e.g., a router decides whether a query goes to a literature search agent, a summarisation agent, or a regulatory compliance agent.",
                "type": "multiple_choice"
            },
            {
                "id": "baw-5",
                "question": "What is 'chunking' in the context of RAG (Retrieval-Augmented Generation) pipelines?",
                "options": [
                    "Deleting irrelevant parts of documents",
                    "Breaking large documents into smaller, overlapping text segments that can be individually searched and retrieved",
                    "Compressing files for storage efficiency",
                    "Grouping similar documents together"
                ],
                "correct_index": 1,
                "explanation": "Documents are split into chunks (typically 500-1500 characters) with some overlap. Each chunk is embedded as a vector. When a query arrives, the most relevant chunks are retrieved and passed to the LLM as context.",
                "type": "multiple_choice"
            },
            {
                "id": "baw-6",
                "question": "SCENARIO: Your AI document processing workflow is producing inconsistent outputs for the same document. What is the most likely cause and fix?",
                "options": [
                    "The internet is slow",
                    "High model temperature causing non-deterministic outputs - lower the temperature setting or use temperature=0 for consistent extraction tasks",
                    "The document is too long",
                    "The AI model needs retraining"
                ],
                "correct_index": 1,
                "explanation": "For deterministic tasks (extraction, classification, structured output), set temperature to 0 or very low. High temperature introduces randomness by design - useful for creative tasks, harmful for consistent data processing.",
                "type": "scenario"
            },
            {
                "id": "baw-7",
                "question": "What is 'vector similarity search' used for in AI document retrieval?",
                "options": [
                    "Searching for exact keyword matches in documents",
                    "Finding semantically similar content by comparing numerical vector representations of text - retrieves conceptually related content even when exact words differ",
                    "Checking document formatting consistency",
                    "Searching vector graphics in documents"
                ],
                "correct_index": 1,
                "explanation": "Vector search converts text to numerical embeddings. Query 'drug safety findings' might retrieve a paragraph about 'adverse event profile' even without keyword overlap, because they're semantically close in vector space.",
                "type": "multiple_choice"
            },
            {
                "id": "baw-8",
                "question": "What is a key difference between 'fine-tuning' a model and using 'RAG' for domain-specific knowledge?",
                "options": [
                    "Fine-tuning is cheaper than RAG",
                    "Fine-tuning bakes knowledge into model weights (expensive, static, needs retraining to update); RAG retrieves from an external database (cheaper, dynamic, easy to update)",
                    "RAG requires more training data than fine-tuning",
                    "Fine-tuning is better for all use cases"
                ],
                "correct_index": 1,
                "explanation": "RAG is often preferred for document-heavy enterprise use cases because the knowledge base can be updated without expensive model retraining. Fine-tuning is better for style/format adaptation.",
                "type": "multiple_choice"
            },
            {
                "id": "baw-9",
                "question": "SCENARIO: You want to build a workflow to automatically classify incoming medical queries into departments (safety, medical information, regulatory). Which approach is most robust?",
                "options": [
                    "Send all queries to one person to sort",
                    "Use an LLM classifier with few-shot examples + confidence scoring; route low-confidence classifications to human review before sending to department",
                    "Use keyword matching only",
                    "Let each department check all queries"
                ],
                "correct_index": 1,
                "explanation": "Robust AI classification includes: LLM with examples (high accuracy), confidence scores (know when uncertain), and human-in-the-loop for low confidence cases. Never route medical queries to wrong teams automatically.",
                "type": "scenario"
            },
            {
                "id": "baw-10",
                "question": "What is 'evaluation' in the context of AI workflow quality assurance?",
                "options": [
                    "Having managers review AI tools annually",
                    "Systematically measuring AI output quality against defined criteria using test cases, ground truth data, and metrics like accuracy, hallucination rate, and latency",
                    "Reading AI output documentation",
                    "Counting how many times the AI is used"
                ],
                "correct_index": 1,
                "explanation": "AI eval (evaluation) is a continuous QA process: build test cases representing real scenarios, measure outputs against expected results, track metrics over time. Essential before deploying AI in regulated workflows.",
                "type": "multiple_choice"
            },
            {
                "id": "baw-11",
                "question": "What is a 'human-in-the-loop' (HITL) process and when is it mandatory?",
                "options": [
                    "Having a human type prompts for the AI",
                    "A workflow design where AI outputs are reviewed, validated, or approved by a human before action is taken - mandatory for regulated outputs, patient-facing content, and high-risk decisions",
                    "Having IT support available during AI use",
                    "Training humans to use AI tools"
                ],
                "correct_index": 1,
                "explanation": "HITL is mandatory when AI outputs feed into regulated processes (submissions, labels, publications), affect patient safety, or have legal/contractual implications. AI accelerates; humans validate and are accountable.",
                "type": "multiple_choice"
            },
            {
                "id": "baw-12",
                "question": "SCENARIO: Your RAG system retrieves the wrong sections from a large clinical document, giving irrelevant answers. What is the most likely technical cause?",
                "options": [
                    "The model is not intelligent enough",
                    "Poor chunking strategy - chunks may be too large (losing precision) or too small (losing context), or metadata filtering is not configured to limit retrieval to relevant document sections",
                    "The internet connection is unstable",
                    "The document is in the wrong language"
                ],
                "correct_index": 1,
                "explanation": "RAG retrieval quality depends heavily on chunk size, overlap, and metadata. Poor chunking breaks coherent ideas across boundaries. Adding metadata filters (document type, section) improves precision dramatically.",
                "type": "scenario"
            },
            {
                "id": "baw-13",
                "question": "What is 'prompt caching' and what is its main benefit?",
                "options": [
                    "Saving favourite prompts in a library",
                    "Storing the processed representation of a repeated system prompt/document so the AI doesn't reprocess it for every query, reducing cost and latency by up to 90%",
                    "A security mechanism to prevent prompt injection",
                    "Translating prompts to other languages"
                ],
                "correct_index": 1,
                "explanation": "Prompt caching (available in Claude and GPT-4o) stores the KV cache of repeated context. If you always start with the same 100K-token document, caching means you only pay to process it once.",
                "type": "multiple_choice"
            },
            {
                "id": "baw-14",
                "question": "SCENARIO: You are building an AI tool for medical affairs to summarise scientific publications. How do you handle the risk of hallucinated citations?",
                "options": [
                    "Trust the AI - it rarely hallucinates citations",
                    "Use a RAG approach where the AI only generates summaries from retrieved real documents, include a citation verification step that checks cited DOIs exist, and require human validation before sharing",
                    "Tell users to check citations manually sometimes",
                    "Use only GPT-4 as it doesn't hallucinate"
                ],
                "correct_index": 1,
                "explanation": "Citation hallucination is a known LLM failure mode. RAG grounds responses in real documents, DOI verification catches fabricated references, and human validation catches remaining errors. Multiple safety layers are needed.",
                "type": "scenario"
            },
            {
                "id": "baw-15",
                "question": "What does 'latency' mean in AI workflow performance?",
                "options": [
                    "The AI's tendency to be incorrect",
                    "The time delay between sending a request to an AI and receiving the response - critical for real-time user-facing applications",
                    "The AI model's memory capacity",
                    "The number of tokens generated per second"
                ],
                "correct_index": 1,
                "explanation": "Latency (response time) is key for user experience. Complex RAG pipelines add latency at each step. For async batch processing, high latency is acceptable; for real-time document Q&A, fast responses matter.",
                "type": "multiple_choice"
            },
            {
                "id": "baw-16",
                "question": "What is 'guardrailing' an AI workflow?",
                "options": [
                    "Adding physical security to AI servers",
                    "Implementing safety and quality checks that prevent AI outputs from violating content policies, accuracy thresholds, or format requirements before they reach end users",
                    "Limiting AI to specific users",
                    "Adding speed limits to AI processing"
                ],
                "correct_index": 1,
                "explanation": "Guardrails are programmatic checks on AI inputs/outputs: content filters (no PII output), confidence thresholds (don't show low-confidence answers), format validators (output must parse as JSON), topic restrictions.",
                "type": "multiple_choice"
            },
            {
                "id": "baw-17",
                "question": "SCENARIO: Your AI medical writing assistant starts producing outputs with a noticeably different style and more errors after an API provider update. What should you do?",
                "options": [
                    "Continue using it - model updates always improve performance",
                    "Run your evaluation test suite against the new model version, compare results to baseline, and if quality has degraded, pin to the previous model version or adjust prompts for the new version",
                    "Switch to a different AI provider immediately",
                    "Stop using AI tools until the provider fixes the issue"
                ],
                "correct_index": 1,
                "explanation": "This is model drift from provider updates. Having an eval test suite means you can objectively measure the impact. Model versioning allows you to pin to a specific model version to maintain consistency.",
                "type": "scenario"
            },
            {
                "id": "baw-18",
                "question": "What is the key principle of 'defence in depth' applied to AI workflow security?",
                "options": [
                    "Using military-grade encryption for AI data",
                    "Layering multiple security controls so that if one fails, others still protect - e.g., input sanitisation + output filtering + human review + audit logging rather than relying on any single control",
                    "Keeping AI tools offline",
                    "Restricting AI to approved vendors only"
                ],
                "correct_index": 1,
                "explanation": "No single AI safety control is perfect. Defence in depth stacks multiple controls: sanitise inputs, filter outputs, require human sign-off, log all interactions, and monitor for anomalies - creating overlapping safety nets.",
                "type": "multiple_choice"
            }
        ]
    }
}
