import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

        // Determine tier and messaging
        let tierLabel = "";
        let description = "";
        let badgeIcon = "";
        let tierColor = "";

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
            description = pickRandom(excellentMessages);
            badgeIcon = "🏆";
            tierColor = "#b45309";
        } else if (score >= 60) {
            tierLabel = "مشاركة فعالة ومتميزة";
            description = pickRandom(goodMessages);
            badgeIcon = "🎖️";
            tierColor = "#1d4ed8";
        } else if (score >= 35) {
            tierLabel = "مثابرة وجهد مشكور";
            description = pickRandom(fairMessages);
            badgeIcon = "⭐";
            tierColor = "#047857";
        } else {
            tierLabel = "قلوبنا معك - فخورون بك";
            description = pickRandom(supportMessages);
            badgeIcon = "❤️";
            tierColor = "#be123c";
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
