

SAMPLE_QUESTIONS = [
    {"title": "ما اسمك الكريم؟",                        "slug": "client_name",            "type": "text",          "placeholder": "أدخل اسمك هنا"},
    {"title": "ما هو بريدك الإلكتروني؟",                "slug": "client_email",           "type": "email",         "placeholder": "example@email.com"},
    {"title": "ما هو رقم هاتفك؟",                       "slug": "client_phone",           "type": "phone",         "placeholder": "+966 5XX XXX XXXX"},
    {"title": "ما نوع المشروع الذي تريده؟",             "slug": "project_type",           "type": "single_choice", "options": ["موقع إلكتروني", "تطبيق جوال", "متجر إلكتروني", "نظام إدارة", "أخرى"]},
    {"title": "ما هو نشاطك التجاري؟",                   "slug": "business_sector",        "type": "text",          "placeholder": "مثال: مطعم، متجر ملابس..."},
    {"title": "ما الخدمات التي تحتاجها؟",               "slug": "required_services",      "type": "multi_choice",  "options": ["تصميم UI/UX", "تطوير Frontend", "تطوير Backend", "قاعدة بيانات", "استضافة وتشغيل", "SEO وتسويق"]},
    {"title": "ما هي ميزانيتك المتوقعة؟",               "slug": "budget_range",           "type": "single_choice", "options": ["أقل من 5,000 ريال", "5,000 - 15,000 ريال", "15,000 - 50,000 ريال", "أكثر من 50,000 ريال"]},
    {"title": "متى تريد إطلاق المشروع؟",                "slug": "launch_timeline",        "type": "single_choice", "options": ["خلال شهر", "خلال 3 أشهر", "خلال 6 أشهر", "لا يوجد وقت محدد"]},
    {"title": "هل لديك تصميم أو هوية بصرية؟",          "slug": "has_design",             "type": "single_choice", "options": ["نعم، لدي تصميم جاهز", "لدي أفكار فقط", "أحتاج تصميم من الصفر"]},
    {"title": "هل سبق وعملت مع مطور من قبل؟",          "slug": "has_previous_developer", "type": "single_choice", "options": ["نعم", "لا"]},
    {"title": "ما المشاكل التي تريد حلها؟",             "slug": "problem_to_solve",       "type": "textarea",      "placeholder": "اشرح المشكلة أو الفرصة التي يعالجها مشروعك..."},
    {"title": "من هو جمهورك المستهدف؟",                 "slug": "target_audience",        "type": "textarea",      "placeholder": "صف عملاءك المثاليين..."},
    {"title": "هل لديك أمثلة على مواقع تعجبك؟",        "slug": "inspirational_examples", "type": "textarea",      "placeholder": "ضع روابط أو أسماء للمشاريع المشابهة..."},
    {"title": "ما اللغات التي يجب أن يدعمها المشروع؟", "slug": "supported_languages",    "type": "multi_choice",  "options": ["العربية", "الإنجليزية", "كلاهما", "لغات أخرى"]},
    {"title": "أي معلومات إضافية تريد مشاركتها؟",      "slug": "additional_notes",       "type": "textarea",      "placeholder": "أي تفاصيل أخرى مهمة..."},
]
