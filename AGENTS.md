# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable design decisions

- Use the selected option 2 visual direction for the calculator body: compact dark action toolbar, white input workbench, pale-green quotation result panel, numbered inputs, and dense formula breakdown.
- Preserve the navigation menu for `Tem nhãn`, `Mực in ribbon`, `Gia công`, `Khách hàng` (comprising Customer Directory and Supplier Import Prices), `Báo giá`, and `Cài đặt` while adopting option 2 styling in the main content.
- Keep the credit as one short line: `Dev by dbysoftware.com`.
- Keep the top menu and title bar on the same navy color; use a compact 62px menu with moderate 18px icons and a restrained active-state highlight.
- Keep the `UNITECH PRICING` window title bar compact in a Microsoft Store-like desktop style: about 40px high with a 22px brand mark.
- Pack the navigation items into the same compact top bar, beside the Unitech brand, instead of using a separate tall menu row.
- Use one continuous dark-green palette across the title bar and packed top menu (`#123c20` base); the selected menu item alone uses lighter green (`#1a7540`). Prevent menu overflow into the content header.
- Formula 2 is enabled as `1 chiếc tem`: area m² = width(mm) × length(mm) ÷ 1,000,000; the applied rate/m² = paper price/m² + processing fee/m². Unit price rounds up to 1đ and order total rounds up to 1,000đ, excluding VAT.
- Formula 3 is enabled as `Cuộn tem theo số lượng tem/cuộn`: derived roll length (m) = (label height(mm) + 3) ÷ 1,000 × labels per roll. Its result is then priced through Formula 1: (label width(mm) + 5) ÷ 1,000 × derived meters × paper price/m² + processing fee/roll, with the per-roll price rounded up to 1,000đ, excluding VAT.
- Formula 4 is enabled as `Số tem trong 1 cuộn`: labels per roll = meters per roll ÷ ((label height(mm) + 3) ÷ 1,000). Show the theoretical value and use its whole-number floor as the usable label count.
- Formula 5 is enabled as `Cuộn tem phủ 1 màu`: it uses Formula 1 and adds a fixed 5,000đ color-cover fee to the per-roll processing cost before the usual 1,000đ upward rounding.
- Formula 7 is enabled as `Tem màu cán màng`: it uses Formula 1 and adds fixed 7,000đ color fee plus 4,000đ laminating fee per roll before the usual 1,000đ upward rounding.
- Formula 6 is enabled as `Cuộn tem phủ từ 2 màu`: it uses Formula 1 and adds a fixed 7,000đ color fee per roll before the usual 1,000đ upward rounding.
- The Tem nhãn formula selector intentionally ends at Formula 7; remove the former `Cuộn số mét lẻ` item.
- Separate production cost from selling price with one profit input mode: default to a percentage calculated from production cost; sales can switch to one fixed amount per roll. Do not combine both modes. Round the selling price up to 1,000đ; VAT remains excluded.
- Profit inputs are internal-only: when a calculation is added to a quotation, PDF, or quotation history, persist and show only the final sale price, quantity, and product description—never production cost, profit %, or profit amount.
- Formula entries 2–7 must remain enabled and implemented; do not regress them to disabled or “Chưa có công thức”.
- The release workflow must collect all local release artifacts directly in `release\`: EXE, MSI, updater `.sig`, and `latest.json`; users should not need to retrieve files from `src-tauri\target`.
- Updater signing must never prompt the user for a password: `release.bat` reads an automatically generated password from `%LOCALAPPDATA%\UnitechPricing\updater\unitech-pricing.password`, builds with `--no-sign`, then signs the current-version NSIS EXE explicitly. The local `release\` folder keeps only the newest EXE, its `.sig`, and `latest.json`.
- `release-patch.bat` is the fast path for small fixes: auto-increment patch version, build only the NSIS bundle, sign locally without prompting, and publish the EXE, `.sig`, and `latest.json` directly under a `patch-vX.Y.Z` GitHub Release tag so the normal `v*` Actions build is not triggered. Tauri updates remain full signed installers (about 3–4 MB), not source-file or Electron-style resource deltas.
- `Xem bản xem trước PDF` from a calculator is an ephemeral preview only: it must not add a line, persist a draft, or navigate to `Báo giá`. Only `Đưa vào Đơn Báo giá` performs that action.
- Saving a quotation to history finalizes its active draft: save a history snapshot, then replace the editor with a fresh empty draft and show the history. The editor must provide an explicit confirmed `Hủy bản nháp` action; it clears only the unsaved draft and never history.
- Creating a new quotation must use a visibly new, unique quotation number. If the current draft contains customer data or line items, require confirmation before replacing it.
- The calculation form, quotation draft, quote terms, and quote history must open empty until the user enters/saves them. Keep the supplied supplier-paper and customer demo directories available as selectable master data for quick quotation entry.
- Monetary values must use Vietnamese thousands separators consistently in both editable currency fields and read-only values: `9200` displays as `9.200`, while non-currency dimensions and quantities retain their natural numeric format.
- Automatic updates use signed Tauri updater artifacts published to public GitHub Releases at `yendao444-del/unitech-pricing`. The updater private key is never committed; it is stored only as a GitHub Actions secret.
- Releases are normally made by double-clicking `release.bat`: it automatically increments the patch version, includes all current source changes in that release, validates/builds/tests, synchronizes Tauri/Cargo version values, builds the local signed Windows NSIS `.exe`, then commits/pushes/tag-pushes so GitHub Actions publishes the matching signed updater release. An explicit `vX.Y.Z` argument is only for intentional minor/major versions.
- A release must not report success until updater preflight passes twice: first against the local manifest/installer and then against files downloaded back through the public production endpoint. The checks must reject UTF-8 BOM manifests, wrong versions or URLs, mismatched `.sig` content, and installer signatures that do not verify with the exact public key embedded in the app.
- In-app updates must show a blocking, branded progress screen during check, download, and installation, clearly warn that the app will close and reopen, and show a success confirmation after the updated version launches.
- Calculator input and result panels must fit in a single laptop-sized desktop view with no internal vertical scrollbars; compact header, rows, supplier selector, margin controls, and result rows instead of hiding information.
- On normal desktop windows (800px+ high), restore comfortable readable sizing while keeping the one-screen/no-scroll requirement; reserve the ultra-compact sizing only for genuinely short windows.
- Use customer-friendly terminology in the calculator selector: label it `Phương thức báo giá`, with methods named by how customers order (theo mét, theo chiếc, theo số lượng tem, in 1 màu, in nhiều màu, cán màng) rather than technical formula descriptions.
