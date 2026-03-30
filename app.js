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

    // Live gender-aware UI update
    const welcomeTitle = document.getElementById('welcome-title');
    const welcomeDesc = document.getElementById('welcome-desc');

    document.querySelectorAll('input[name="gender"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'female') {
                welcomeTitle.textContent = 'مرحباً بكِ يا متميّزة';
                welcomeDesc.textContent = 'التعلم في ظل هذه الظروف هو إنجاز بحد ذاته. نحن فخورون بكِ! أجيبي عن هذه الأسئلة البسيطة لنحتفي بجهودكِ.';
            } else {
                welcomeTitle.textContent = 'مرحباً بك يا متميّز';
                welcomeDesc.textContent = 'التعلم في ظل هذه الظروف هو إنجاز بحد ذاته. نحن فخورون بك! أجب عن هذه الأسئلة البسيطة لنحتفي بجهودك.';
            }
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        btnText.textContent = "جاري الإصدار...";
        loader.classList.remove('hidden');
        submitBtn.disabled = true;

        // Gather Data
        const studentName = document.getElementById('student-name').value;
        const selfEval = document.getElementById('self-eval').value;
        const genderInput = document.querySelector('input[name="gender"]:checked');
        const gender = genderInput ? genderInput.value : 'male'; // default to male
        const isFemale = gender === 'female';
        
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

        const excellentMessages = isFemale ? [
            "تقديراً لجهودها الاستثنائية وتفوقها الواضح وحرصها الشديد ومشاركتها الفعالة في التعلم عن بعد، وتميزها الملحوظ.",
            "بكل فخر ومحبة نثمن هذا الأداء الرائع والتميز الملحوظ في متابعة الدروس والمهمات التعليمية، أداء يستحق الثناء والتقدير.",
            "تألقت كالنجمة الساطعة في سماء منصتنا التعليمية! نشيد بالتزامها العالي وشغفها الكبير للتعلم وإنجاز المهام على أكمل وجه."
        ] : [
            "تقديراً لجهوده الاستثنائية وتفوقه الواضح وحرصه الشديد ومشاركته الفعالة في التعلم عن بعد، وتميزه الملحوظ.",
            "بكل فخر ومحبة نثمن هذا الأداء الرائع والتميز الملحوظ في متابعة الدروس والمهمات التعليمية، أداء يستحق الثناء والتقدير.",
            "تألق كالنجم الساطع في سماء منصتنا التعليمية! نشيد بالتزامه العالي وشغفه الكبير للتعلم وإنجاز المهام على أكمل وجه."
        ];

        const goodMessages = isFemale ? [
            "تقديراً لالتزامها الطيب ومشاركتها الفعالة وحرصها المتميز على مواصلة مسيرتها التعليمية بهمة ونشاط.",
            "شكراً لجهودك الجميلة والمستمرة التي تثبت أنكِ متميّزة حقيقية تسعى دائماً نحو الأفضل بخطوات ثابتة.",
            "مشاركة رائعة وجهد مبارك في متابعة التعلم عن بعد وإتمام المهام، ننتظر منكِ المزيد من الإبداع."
        ] : [
            "تقديراً لالتزامه الطيب ومشاركته الفعالة وحرصه المتميز على مواصلة مسيرته التعليمية بهمة ونشاط.",
            "شكراً لجهودك الجميلة والمستمرة التي تثبت أنك متميّز حقيقي يسعى دائماً نحو الأفضل بخطوات ثابتة.",
            "مشاركة رائعة وجهد مبارك في متابعة التعلم عن بعد وإتمام المهام، ننتظر منك المزيد من الإبداع."
        ];

        const fairMessages = isFemale ? [
            "تقديراً لمحاولاتها وجهودها المبذولة في متابعة التعلم، وإصرارها على عدم الاستسلام. كل خطوة في طريق التعلم تستحق التقدير!",
            "الوصول إلى القمة يبدأ بخطوات واثقة، ونحن نقدر جداً كل دقيقة خصصتِها للتعلم وإنجاز المهام، استمري في التقدم!",
            "نقدر هذه الهمة الطيبة في الحضور ومحاولة الحل رغم كافة الصعاب، نحن نؤمن بقدراتكِ الرائعة للمرحلة القادمة."
        ] : [
            "تقديراً لمحاولاته وجهوده المبذولة في متابعة التعلم، وإصراره على عدم الاستسلام. كل خطوة في طريق التعلم تستحق التقدير!",
            "الوصول إلى القمة يبدأ بخطوات واثقة، ونحن نقدر جداً كل دقيقة خصصتها للتعلم وإنجاز المهام، استمر في التقدم!",
            "نقدر هذه الهمة الطيبة في الحضور ومحاولة الحل رغم كافة الصعاب، نحن نؤمن بقدراتك الرائعة للمرحلة القادمة."
        ];

        const supportMessages = isFemale ? [
            "تقديراً لصمودها وصبرها. نحن نعلم أن الظروف قد تكون قاسية وأنكِ تبذلين ما بوسعكِ. نجاحك الأكبر هو سلامتكِ وعزيمتكِ.",
            "أنتِ متميّزة في نظرنا! غيابكِ أحياناً لا يقلل من قيمتكِ وحرصكِ. قلوبنا معكِ وندعمكِ في جميع الأوقات.",
            "المثابرة وسط التحديات هي أسمى درجات النجاح. نقّدر محاولاتكِ ونفخر بكِ دائماً وأبداً."
        ] : [
            "تقديراً لصموده وصبره. نحن نعلم أن الظروف قد تكون قاسية وأنك تبذل ما بوسعك. نجاحك الأكبر هو سلامتك وعزيمتك.",
            "أنت متميّز في نظرنا! غيابك أحياناً لا يقلل من قيمتك وحرصك. قلوبنا معك وندعمك في جميع الأوقات.",
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

        // Update gender-sensitive static text
        const certPresentedText = document.getElementById('cert-presented-text');
        const certTeacherLabel = document.getElementById('cert-teacher-label');
        const resultCongrats   = document.getElementById('result-congrats');
        const resultSubtitle   = document.getElementById('result-subtitle');

        if (isFemale) {
            certPresentedText.textContent = 'تُمنَح هذه الشهادة بكل فخر واعتزاز إلى الطالبة المتميّزة:';
            certTeacherLabel.textContent  = 'معلمتك الفخورة';
            resultCongrats.textContent    = 'مبارك لكِ إنجازك! 🎉';
            resultSubtitle.textContent    = 'لقد صممنا هذه الشهادة خصيصاً لكِ بناءً على تقييمك الذاتي الجميل.';
        } else {
            certPresentedText.textContent = 'تُمنَح هذه الشهادة بكل فخر واعتزاز إلى الطالب المتميّز:';
            certTeacherLabel.textContent  = 'معلمك الفخور';
            resultCongrats.textContent    = 'مبارك لك إنجازك! 🎉';
            resultSubtitle.textContent    = 'لقد صممنا هذه الشهادة خصيصاً لك بناءً على تقييمك الذاتي الجميل.';
        }

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

    // ─── Shared: render certificate to a high-res canvas ───────────────────────
    function generateCertificateImage() {
        return new Promise((resolve, reject) => {
            const certElement = document.getElementById('certificate');
            const certWrapper  = document.querySelector('.certificate-wrapper');

            // Strip zoom so html2canvas captures the real size
            const prevZoom = certWrapper.style.zoom;
            certWrapper.style.zoom = '1';

            setTimeout(() => {
                html2canvas(certElement, {
                    scale: 3,           // high-res for social media
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    width:  certElement.offsetWidth,
                    height: certElement.offsetHeight
                }).then(canvas => {
                    certWrapper.style.zoom = prevZoom;
                    resolve(canvas);
                }).catch(err => {
                    certWrapper.style.zoom = prevZoom;
                    reject(err);
                });
            }, 150);
        });
    }

    function setButtonLoading(btn, loadingText) {
        const original = btn.innerHTML;
        btn.innerHTML  = loadingText;
        btn.disabled   = true;
        return () => { btn.innerHTML = original; btn.disabled = false; };
    }

    // ─── Download ────────────────────────────────────────────────────────────────
    document.getElementById('btn-download').addEventListener('click', async () => {
        const btn    = document.getElementById('btn-download');
        const restore = setButtonLoading(btn, '⏳ جاري التجهيز...');
        try {
            const canvas = await generateCertificateImage();
            const studentName = document.getElementById('student-name').value || 'الطالب';
            const link = document.createElement('a');
            link.download = `شهادة_تقدير_${studentName}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('خطأ في التنزيل:', err);
            alert('عذراً، حدث خطأ أثناء تحميل الصورة.');
        } finally {
            restore();
        }
    });

    // ─── Share (Web Share API) ────────────────────────────────────────────────────
    document.getElementById('btn-share').addEventListener('click', async () => {
        const btn      = document.getElementById('btn-share');
        const restore  = setButtonLoading(btn, '⏳ جاري التجهيز...');
        const studentName = document.getElementById('student-name').value || 'الطالب';
        try {
            const canvas = await generateCertificateImage();
            canvas.toBlob(async (blob) => {
                const file = new File([blob], `شهادة_تقدير_${studentName}.png`, { type: 'image/png' });
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'شهادة تقدير واعتزاز 🏅',
                        text: `أنا ${studentName} حصلت على شهادة تقدير من مدرسة مشيرفة الابتدائية! 🎉`,
                        files: [file]
                    });
                } else {
                    // Fallback: download the image so the user can share manually
                    const link = document.createElement('a');
                    link.download = `شهادة_تقدير_${studentName}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    alert('تم تحميل الشهادة! يمكنك الآن مشاركتها يدوياً على واتساب أو فيسبوك.');
                }
                restore();
            }, 'image/png');
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('خطأ في المشاركة:', err);
                alert('عذراً، حدث خطأ أثناء المشاركة.');
            }
            restore();
        }
    });

    // ─── Copy to Clipboard ────────────────────────────────────────────────────────
    document.getElementById('btn-copy').addEventListener('click', async () => {
        const btn    = document.getElementById('btn-copy');
        const restore = setButtonLoading(btn, '⏳ جاري النسخ...');
        try {
            const canvas = await generateCertificateImage();
            canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    btn.innerHTML = '✅ تم النسخ!';
                    setTimeout(restore, 2000);
                } catch (e) {
                    // Clipboard API not supported; fallback to download
                    const studentName = document.getElementById('student-name').value || 'الطالب';
                    const link = document.createElement('a');
                    link.download = `شهادة_تقدير_${studentName}.png`;
                    link.href = URL.createObjectURL(blob);
                    link.click();
                    alert('متصفحك لا يدعم النسخ المباشر. تم تحميل الصورة بدلاً من ذلك.');
                    restore();
                }
            }, 'image/png');
        } catch (err) {
            console.error('خطأ في النسخ:', err);
            restore();
        }
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
