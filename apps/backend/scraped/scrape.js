import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs/promises";
import path from "path";

puppeteer.use(StealthPlugin());

// =======================
// ⚙️ Cấu hình
// =======================
const COFFEE_REGIONS = [
    { name: "Lâm Đồng", url: "https://giacaphe.com/gia-ca-phe-lam-dong/" },
    { name: "Đắk Lắk", url: "https://giacaphe.com/gia-ca-phe-dak-lak/" },
    { name: "Gia Lai", url: "https://giacaphe.com/gia-ca-phe-gia-lai/" },
    { name: "Đắk Nông", url: "https://giacaphe.com/gia-ca-phe-dak-nong/" },
];
const PEPPER_URL = "https://giacaphe.com/gia-tieu-hom-nay/";

const OUT_DIR = path.join(process.cwd(), "scraped");
const DATA_FILE = path.join(OUT_DIR, "all_regions.json");
const WAIT_MS = 8000;

// =======================
// 🔧 Tiện ích
// =======================
async function ensureOutDir() {
    await fs.mkdir(OUT_DIR, { recursive: true });
}

async function loadExistingData() {
    try {
        const text = await fs.readFile(DATA_FILE, "utf-8");
        const data = JSON.parse(text);

        // Đảm bảo có cấu trúc phân nhóm riêng cho cà phê và tiêu
        if (!data.coffeeDate) data.coffeeDate = null;
        if (!data.pepperDate) data.pepperDate = null;

        return data;
    } catch {
        return {
            scrapedAt: new Date().toISOString(),
            coffeeDate: null,
            pepperDate: null,
            regions: [],
        };
    }
}

function calcTrend(prev, curr) {
    if (curr > prev) return "↑ tăng";
    if (curr < prev) return "↓ giảm";
    return "=";
}

function mergeRegionData(oldRegion, newRegion) {
    if (!oldRegion) return newRegion;

    const oldDates = new Set(oldRegion.data.map((d) => d["Ngày"]));
    const mergedData = [
        ...newRegion.data.filter((d) => !oldDates.has(d["Ngày"])),
        ...oldRegion.data,
    ];

    mergedData.sort((a, b) => {
        const [da, ma, ya] = a["Ngày"].split("/").map(Number);
        const [db, mb, yb] = b["Ngày"].split("/").map(Number);
        return new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da);
    });

    return { ...oldRegion, data: mergedData };
}

// =======================
// ☕ Cào giá cà phê
// =======================
async function scrapeCoffee(page, existing) {
    for (const region of COFFEE_REGIONS) {
        const fullName = `Cà phê ${region.name}`;
        console.log(`\n🔎 Cào ${fullName} — ${region.url}`);

        try {
            await page.goto(region.url, { waitUntil: "domcontentloaded", timeout: 60000 });
            await new Promise((r) => setTimeout(r, WAIT_MS));

            const rows = await page.$$eval("table.price-table tbody tr", (trs) =>
                trs
                    .map((tr) => {
                        const tds = tr.querySelectorAll("td");
                        if (tds.length >= 3) {
                            const Ngày = tds[0].innerText.trim();
                            const Giá = tds[1].innerText.trim();
                            const ThayĐổi = tds[2].innerText.trim();
                            const priceValue = parseInt(Giá.replace(/\D/g, "")) || 0;
                            return { Ngày, Giá, ThayĐổi, priceValue };
                        }
                        return null;
                    })
                    .filter(Boolean)
            );

            if (!rows.length) {
                console.log(`⚠️ Không tìm thấy dữ liệu cho ${fullName}`);
                continue;
            }

            const latest = rows[0]?.priceValue || 0;
            const oldRegion = existing.regions.find((r) => r.region === region.name);
            const prev = oldRegion?.data?.[0]?.priceValue || 0;
            const trend = calcTrend(prev, latest);

            const newRegion = {
                name: fullName,
                region: region.name,
                data: rows,
                trend,
            };

            if (oldRegion) {
                const merged = mergeRegionData(oldRegion, newRegion);
                merged.trend = trend;
                Object.assign(oldRegion, merged);
            } else {
                existing.regions.push(newRegion);
            }

            console.table(rows.slice(0, 5));
            console.log(`📊 ${fullName}: ${latest} (${trend})`);
        } catch (err) {
            console.error(`❌ Lỗi khi cào ${region.name}:`, err.message);
        }
    }
    // Cập nhật ngày mới nhất cà phê
    try {
        const allDates = existing.regions
            .filter(r => r.name.startsWith("Cà phê"))
            .flatMap(r => r.data.map(d => d["Ngày"]));
        if (allDates.length) {
            const sorted = allDates.sort((a, b) => {
                const [da, ma, ya] = a.split("/").map(Number);
                const [db, mb, yb] = b.split("/").map(Number);
                return new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da);
            });
            existing.coffeeDate = sorted[0];
        }
    } catch (err) {
        console.error("⚠️ Không thể xác định ngày mới nhất cà phê:", err.message);
    }

}

// =======================
// 🌶️ Cào giá tiêu
// =======================
async function scrapePepper(page, existing) {
    console.log(`\n🌶️ Bắt đầu cào giá tiêu — ${PEPPER_URL}`);

    try {
        await page.goto(PEPPER_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
        await new Promise((r) => setTimeout(r, WAIT_MS));

        // Lấy ngày từ tiêu đề
        const title = await page.$eval("h1.page-title", (el) => el.innerText.trim());
        const dateMatch = title.match(/(\d{2}\/\d{2}\/\d{4})/);
        const ngay = dateMatch ? dateMatch[1] : new Date().toLocaleDateString("vi-VN");

        const rows = await page.$$eval("#gia-tieu-hom-nay-body table.price-table tbody tr", (trs) =>
            trs.map((tr) => {
                const tds = tr.querySelectorAll("td");
                const KhuVuc = tds[0]?.innerText.trim() || "";
                const GiaMua = tds[1]?.innerText.trim() || "";
                const ThayDoi = tds[2]?.innerText.trim() || "";
                const priceValue = parseInt(GiaMua.replace(/\D/g, "")) || 0;
                return { KhuVuc, GiaMua, ThayDoi, priceValue };
            })
        );

        console.table(rows);
        console.log(`📈 Cào ${rows.length} vùng tiêu ngày ${ngay}`);

        for (const r of rows) {
            const fullName = `Tiêu ${r.KhuVuc}`;
            const oldRegion = existing.regions.find(
                (x) => x.region === r.KhuVuc && x.name.startsWith("Tiêu")
            );

            const newRegion = {
                name: fullName,
                region: r.KhuVuc,
                data: [
                    {
                        Ngày: ngay,
                        Giá: r.GiaMua,
                        ThayĐổi: r.ThayDoi,
                        priceValue: r.priceValue,
                    },
                ],
            };

            const latest = r.priceValue;
            const prev = oldRegion?.data?.[0]?.priceValue || 0;
            const trend = calcTrend(prev, latest);
            newRegion.trend = trend;

            if (oldRegion) {
                const merged = mergeRegionData(oldRegion, newRegion);
                merged.trend = trend;
                Object.assign(oldRegion, merged);
            } else {
                existing.regions.push(newRegion);
            }
        }
    } catch (err) {
        console.error("❌ Lỗi khi cào giá tiêu:", err.message);
    }
    // Cập nhật ngày mới nhất tiêu
    try {
        const allDates = existing.regions
            .filter(r => r.name.startsWith("Tiêu"))
            .flatMap(r => r.data.map(d => d["Ngày"]));
        if (allDates.length) {
            const sorted = allDates.sort((a, b) => {
                const [da, ma, ya] = a.split("/").map(Number);
                const [db, mb, yb] = b.split("/").map(Number);
                return new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da);
            });
            existing.pepperDate = sorted[0];
        }
    } catch (err) {
        console.error("⚠️ Không thể xác định ngày mới nhất tiêu:", err.message);
    }

}

// =======================
// 🚀 Chạy tất cả
// =======================
(async () => {
    await ensureOutDir();
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    const existing = await loadExistingData();

    await scrapeCoffee(page, existing);
    await scrapePepper(page, existing);

    existing.scrapedAt = new Date().toISOString();
    existing.regionCount = existing.regions.length;

    // 🧩 Xác định file output: temp hay chính
    const isTemp = process.argv.includes("--temp");
    const DATA_FILE = path.join("scraped", isTemp ? "temp_check.json" : "all_regions.json");

    await fs.writeFile(DATA_FILE, JSON.stringify(existing, null, 2), "utf-8");
    console.log(`💾 Đã cập nhật file tổng hợp: ${DATA_FILE}`);

    await browser.close();
    console.log("✅ Hoàn tất toàn bộ quá trình cào.\n");
})();
