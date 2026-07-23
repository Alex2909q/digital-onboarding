const puppeteer = require('../РС Головна сторінка/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; // Mac OS Chrome path
const targetUrl = 'http://localhost:8000/';
const outputPdf = path.resolve(__dirname, 'Digital_Onboarding.pdf');
const desktopPdf = '/Users/yandiuk.o/Desktop/Digital_Onboarding.pdf';

const WIDTH = 1200;
const SCALE = 2;

(async () => {
    console.log('Запуск браузера (headless mode)...');
    
    // Fallback path check
    let executablePath = chromePath;
    if (!fs.existsSync(executablePath)) {
        console.error('Не знайдено Chrome за шляхом:', executablePath);
        process.exit(1);
    }

    const browser = await puppeteer.launch({
        executablePath: executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: 1080, deviceScaleFactor: SCALE });

    console.log(`Перехід на сторінку: ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 2000));

    console.log('Підготовка сторінки (відкриття анімацій, налаштування лічильників)...');
    await page.evaluate(() => {
        // Форсуємо відображення анімованих елементів
        const style = document.createElement('style');
        style.textContent = `
            * {
                animation-play-state: paused !important;
                transition: none !important;
            }
            .fade-up, .logistics-anim, .fade-in, .pulse, .slide-in-right, .zoom-in, .scroll-slide-left, .scroll-slide-right, .scroll-fade-up {
                opacity: 1 !important;
                transform: none !important;
                transition: none !important;
                animation: none !important;
            }
            .floating-nav, .floating-dots {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    });

    // Прокрутка для завантаження лінивих ресурсів (якщо є)
    console.log('Прокрутка сторінки для ініціалізації елементів...');
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    window.scrollTo(0, 0);
                    resolve();
                }
            }, 30);
        });
    });

    await new Promise(r => setTimeout(r, 1500));

    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log(`Виміряна висота сторінки: ${bodyHeight}px`);

    console.log('Налаштування висоти viewport...');
    await page.setViewport({
        width: WIDTH,
        height: bodyHeight,
        deviceScaleFactor: SCALE
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('Емулювання медіа-типу "screen"...');
    await page.emulateMediaType('screen');

    console.log('Генерація PDF (векторний метод)...');
    await page.pdf({
        path: outputPdf,
        width: WIDTH + 'px',
        height: bodyHeight + 'px',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    console.log(`Копіювання PDF на Робочий стіл...`);
    fs.copyFileSync(outputPdf, desktopPdf);

    await browser.close();

    const pdfSize = fs.statSync(outputPdf).size;
    console.log(`✅ Успішно! PDF збережено в:`);
    console.log(`   - ${outputPdf}`);
    console.log(`   - ${desktopPdf}`);
    console.log(`   Розмір файлу: ${(pdfSize/1024/1024).toFixed(2)} МБ`);
})().catch(err => {
    console.error('❌ Помилка:', err.message);
    process.exit(1);
});
