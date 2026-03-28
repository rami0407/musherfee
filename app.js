import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// ========== Claude AI Integration ==========

function getApiKey() {
    return localStorage.getItem('claude_api_key') || '';
}

function updateAiBadge() {
    const badge = document.getElementById('ai-badge');
    if (!badge) return;
    if (getApiKey()) {
        badge.textContent = '✅ Claude AI مفعّل';
        badge.style.background = 'rgba(22,163,74,0.25)';
    } else {
        badge.textContent = '⬜ بدون AI';
        badge.style.background = 'rgba(255,255,255,0.15)';
    }
}

async function generateAIDescription(studentName, score, selfEval, q1, q2, q3, q4) {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const attendanceMap = { 100: 'حضر جميع اللقاءات', 75: 'حضر غالبية اللقاءات', 50: 'حضر نصف اللقاءات تقريباً', 30: 'حضر عدداً قليلاً من اللقاءات', 0: 'لم يتمكن من الحضور لظروف خارجة عن إرادته' };
    const tasksMap = { 100: 'أنجز جميع المهام', 75: 'أنجز أغلب المهام', 50: 'أنجز بعض المهام', 30: 'أنجز القليل من المهام', 0: 'لم يتمكن من إنجاز المهام' };
    const benefitMap = { 100: 'استفاد كثيراً جداً', 75: 'استفاد بشكل جيد', 50: 'استفاد قليلاً', 0: 'لم يستفد كما يجب' };
    const participationMap = { 100: 'كان فعالاً ومشاركاً دائماً', 75: 'شارك في بعض الأحيان', 50: 'كان مستمعاً أغلب الوقت', 0: 'لم يستطع المشاركة' };

    const prompt = `أنت مساعد تعليمي متخصص في كتابة نصوص شهادات تقدير للطلاب باللغة العربية الفصحى.

اكتب نص شهادة تقدير مخصص وشخصي للطالب/ـة بناءً على المعلومات التالية:
- اسم الطالب/ـة: ${studentName}
- نسبة الحضور: ${attendanceMap[q1] || q1 + '%'}
- إنجاز المهام: ${tasksMap[q2] || q2 + '%'}
- مستوى الاستفادة: ${benefitMap[q3] || q3 + '%'}
- المشاركة: ${participationMap[q4] || q4 + '%'}
- التقييم الذاتي بكلماته: "${selfEval}"
- الدرجة الإجمالية: ${score.toFixed(0)} من 100

المطلوب: اكتب جملة واحدة أو جملتين فقط (لا أكثر من 40 كلمة) تناسب أن تُكتب في شهادة تقدير رسمية. يجب أن تكون:
1. مشجعة وإيجابية حتى لو كانت الدرجة منخفضة
2. مخصصة لهذا الطالب تحديداً بناءً على معطياته
3. بأسلوب رسمي يليق بشهادة مدرسية
4. تُشير بشكل غير مباشر لجهوده المحددة

أعطني النص مباشرة بدون أي مقدمات أو شرح.`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 200,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('Claude API error:', err);
            return null;
        }

        const data = await response.json();
        return data.content[0].text.trim();
    } catch (e) {
        console.error('Claude API fetch error:', e);
        return null;
    }
}

const firebaseConfig = {
  apiKey: "AIzaSyDTXNfWD_aFaLgIEt5fnbcQDp25mbN9Jfc",
  authDomain: "tkder-8bd96.firebaseapp.com",
  projectId: "tkder-8bd96",
  storageBucket: "tkder-8bd96.firebasestorage.app",
  messagingSenderId: "274475437751",
  appId: "1:274475437751:web:b365fd76dc2673b68c8732",
  measurementId: "G-3CKMYNQ2V1"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // ===== إعداد نافذة Claude API Key =====
    updateAiBadge();

    const settingsBtn = document.getElementById('ai-settings-btn');
    const modalOverlay = document.getElementById('ai-modal-overlay');
    const modalCancel = document.getElementById('ai-modal-cancel');
    const modalSave = document.getElementById('ai-modal-save');
    const apiKeyInput = document.getElementById('api-key-input');
    const keyStatus = document.getElementById('ai-key-status');

    settingsBtn.addEventListener('click', () => {
        apiKeyInput.value = getApiKey();
        keyStatus.innerHTML = '';
        modalOverlay.classList.add('active');
    });
    modalCancel.addEventListener('click', () => modalOverlay.classList.remove('active'));
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('active'); });

    modalSave.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key && !key.startsWith('sk-ant-')) {
            keyStatus.innerHTML = '<span style="color:#dc2626;font-size:0.85rem;">⚠️ المفتاح يبدو غير صحيح. يجب أن يبدأ بـ sk-ant-</span>';
            return;
        }
        if (key) {
            localStorage.setItem('claude_api_key', key);
            keyStatus.innerHTML = '<span style="color:#16a34a;font-size:0.85rem;">✅ تم حفظ المفتاح بنجاح!</span>';
        } else {
            localStorage.removeItem('claude_api_key');
            keyStatus.innerHTML = '<span style="color:#d97706;font-size:0.85rem;">🗑️ تم حذف المفتاح.</span>';
        }
        updateAiBadge();
        setTimeout(() => modalOverlay.classList.remove('active'), 1000);
    });

    // ===== بداية كود الاستمارة =====
    const form = document.getElementById('evaluation-form');
    const mainSection = document.getElementById('app-main');
    const resultSection = document.getElementById('result-view');
    const submitBtn = document.querySelector('.btn-primary');
    const btnText = document.querySelector('.btn-text');
    const loader = document.getElementById('submit-loader');

    // Certificate Elements
    const certName = document.getElementById('cert-name');
    const certReason = document.getElementById('cert-description');
    const certTierText = document.getElementById('cert-tier-text');
    const certStudentQuote = document.getElementById('cert-student-quote');
    const certDate = document.getElementById('cert-date');
    const certBadge = document.getElementById('cert-badge');

    // Set today's date
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    certDate.textContent = today.toLocaleDateString('ar-EG', options);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        btnText.textContent = "جاري الإصدار...";
        loader.classList.remove('hidden');
        submitBtn.disabled = true;

        // Gather Data
        const studentName = document.getElementById('student-name').value;
        const selfEval = document.getElementById('self-eval').value;
        
        const q1 = parseInt(document.querySelector('input[name="q1"]:checked').value);
        const q2 = parseInt(document.querySelector('input[name="q2"]:checked').value);
        const q3 = parseInt(document.querySelector('input[name="q3"]:checked').value);
        const q4 = parseInt(document.querySelector('input[name="q4"]:checked').value);

        // Calculate Average Score
        const score = (q1 + q2 + q3 + q4) / 4;

        // Random Pick Helper
        const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

        // Determine tier
        let tierLabel = "";
        let badgeIcon = "";
        let tierColor = "";
        let fallbackDescription = "";

        const excellentMessages = [
            "تقديراً لجهوده(ا) الاستثنائية وتفوقه(ا) الواضح وحرصه(ا) الشديد ومشاركته(ا) الفعالة في التعلم عن بعد، وتميزه(ا) الملحوظ.",
            "بكل فخر ومحبة نثمن هذا الأداء الرائع والتميز الملحوظ في متابعة الدروس والمهمات التعليمية، أداء يستحق الثناء والتقدير.",
            "تألق(ت) كالنجم الساطع في سماء منصتنا التعليمية! نشيد بالالتزام العالي والشغف الكبير للتعلم وإنجاز المهام على أكمل وجه."
        ];
        const goodMessages = [
            "تقديراً لالتزامه(ا) الطيب ومشاركته(ا) الفعالة وحرصه(ا) المتميز على مواصلة مسيرته(ا) التعليمية بهمة ونشاط.",
            "شكراً لجهودك الجميلة والمستمرة التي تثبت أنك(ِ) بطل(ة) حقيقي(ة) يسعى دائماً نحو الأفضل بخطوات ثابتة.",
            "مشاركة رائعة وجهد مبارك في متابعة التعلم عن بعد وإتمام المهام، ننتظر منك المزيد من الإبداع."
        ];
        const fairMessages = [
            "تقديراً لمحاولاته(ا) وجهوده(ا) المبذولة في متابعة التعلم، وإصراره(ا) على عدم الاستسلام. كل خطوة في طريق التعلم تستحق التقدير!",
            "الوصول إلى القمة يبدأ بخطوات واثقة، ونحن نقدر جداً كل دقيقة خصصتها للتعلم وإنجاز المهام، استمر في التقدم!",
            "نقدر هذه الهمة الطيبة في الحضور ومحاولة الحل رغم كافة الصعاب، نحن نؤمن بقدراتك الرائعة للمرحلة القادمة."
        ];
        const supportMessages = [
            "تقديراً لصموده(ا) وصبره(ا). نحن نعلم أن الظروف قد تكون قاسية وأنك تبذل ما بوسعك. نجاحك الأكبر هو سلامتك وعزيمتك.",
            "أنت بطل(ة) في نظرنا! غيابك أحياناً لا يقلل من قيمتك وحرصك. قلوبنا معك وندعمك في جميع الأوقات.",
            "المثابرة وسط التحديات هي أسمى درجات النجاح. نقّدر محاولاتك ونفخر بك دائماً وأبداً."
        ];

        if (score >= 80) {
            tierLabel = "امتياز وتفوق عالي";
            fallbackDescription = pickRandom(excellentMessages);
            badgeIcon = "🏆";
            tierColor = "#b45309";
        } else if (score >= 60) {
            tierLabel = "مشاركة فعالة ومتميزة";
            fallbackDescription = pickRandom(goodMessages);
            badgeIcon = "🎖️";
            tierColor = "#1d4ed8";
        } else if (score >= 35) {
            tierLabel = "مثابرة وجهد مشكور";
            fallbackDescription = pickRandom(fairMessages);
            badgeIcon = "⭐";
            tierColor = "#047857";
        } else {
            tierLabel = "قلوبنا معك - فخورون بك";
            fallbackDescription = pickRandom(supportMessages);
            badgeIcon = "❤️";
            tierColor = "#be123c";
        }

        // Try to get AI-generated description
        let description = fallbackDescription;
        if (getApiKey()) {
            btnText.textContent = "يكتب Claude شهادتك...✨";
            const aiText = await generateAIDescription(studentName, score, selfEval, q1, q2, q3, q4);
            if (aiText) description = aiText;
        }

        // Log Event to Firebase Analytics
        logEvent(analytics, 'generate_certificate', {
            tier: tierLabel,
            score: score
        });

        // Save data to Firestore Database
        try {
            await addDoc(collection(db, "certificates"), {
                studentName: studentName,
                selfEvaluation: selfEval,
                answers: { q1, q2, q3, q4 },
                score: score,
                tier: tierLabel,
                timestamp: serverTimestamp()
            });
            console.log("Student data successfully saved to Firebase!");
        } catch (error) {
            console.error("Error saving data to Firebase: ", error);
        }

        // Apply Data to Certificate
        certName.textContent = studentName;
        certStudentQuote.textContent = selfEval;
        certTierText.textContent = `التصنيف: ${tierLabel}`;
        certTierText.style.color = tierColor;
        certReason.textContent = description;
        certBadge.textContent = badgeIcon;

        // Simulate network/generation time for better UX
        setTimeout(() => {
            mainSection.classList.add('hidden');
            resultSection.classList.remove('hidden');
            
            // Play Sound
            const sound = document.getElementById('celebration-sound');
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => console.log("Audio autoplay prevented:", e));
            }
            
            // Trigger Confetti effect
            const duration = 3 * 1000;
            const end = Date.now() + duration;

            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#2563eb', '#f59e0b', '#1d4ed8', '#fbbf24']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#2563eb', '#f59e0b', '#1d4ed8', '#fbbf24']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
            
            // Reset button
            btnText.textContent = "إصدار شهادة التقدير";
            loader.classList.add('hidden');
            submitBtn.disabled = false;
            
            // Scroll to the result
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
    });

    // Download Certificate functionality using dom-to-image
    document.getElementById('btn-download').addEventListener('click', () => {
        const certElement = document.getElementById('certificate');
        const downloadBtn = document.getElementById('btn-download');
        
        // Temporarily change button text
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = "⏳ جاري التجهيز...";
        downloadBtn.disabled = true;
        
        // Important: When scaling is applied via CSS zoom (for small screens), 
        // dom-to-image might capture it small. It's usually better at 100% scale.
        // We ensure a good resolution output by adjusting properties if needed, 
        // but here standard dom-to-image toJpeg works well.
        domtoimage.toJpeg(certElement, { quality: 0.95, bgcolor: '#ffffff' })
            .then(function (dataUrl) {
                const link = document.createElement('a');
                link.download = `شهادة_تقدير_${document.getElementById('student-name').value}.jpg`;
                link.href = dataUrl;
                link.click();
                
                // Reset button
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            })
            .catch(function (error) {
                console.error('oops, something went wrong!', error);
                alert("عذراً، حدث خطأ أثناء تحميل الصورة. يرجى محاولة الطباعة بدلاً من ذلك.");
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            });
    });

    // Print Certificate
    document.getElementById('btn-print').addEventListener('click', () => {
        window.print();
    });

    // Restart process
    document.getElementById('btn-restart').addEventListener('click', () => {
        resultSection.classList.add('hidden');
        mainSection.classList.remove('hidden');
        form.reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
