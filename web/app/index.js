import "./globals.css";

document.addEventListener("DOMContentLoaded", () => {
  const API_KEY = "644944861917c4ea";
  const styleUrl = `https://api.protomaps.com/styles/v5/light/ru.json?key=${API_KEY}`;
  const REMOVE = ["buildings", "address_label", "pois"];
  const tilesUrl = new URL("tiles/", document.baseURI).href + "{z}/{x}/{y}.pbf";

  const NO_DATA = "#bdbdbd";
  const YEAR_RAMP = [
    { label: "до 1900", color: "#a50026" },
    { label: "1900–1919", color: "#d73027", from: 1900 },
    { label: "1920–1939", color: "#f46d43", from: 1920 },
    { label: "1940–1959", color: "#fdae61", from: 1940 },
    { label: "1960–1979", color: "#fee090", from: 1960 },
    { label: "1980–1999", color: "#e0f3f8", from: 1980 },
    { label: "2000–2019", color: "#abd9e9", from: 2000 },
    { label: "2020+", color: "#4575b4", from: 2020 },
  ];

  const yearStep = ["step", ["get", "r_year_int"], YEAR_RAMP[0].color];
  for (const { color, from } of YEAR_RAMP.slice(1)) yearStep.push(from, color);

  const escapeHtml = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]
    );

  fetch(styleUrl)
    .then((res) => res.json())
    .then((style) => {
      style.layers = style.layers.filter((l) => !REMOVE.includes(l.id));

      style.sources["omsk"] = {
        type: "vector",
        tiles: [tilesUrl],
        minzoom: 12,
        maxzoom: 15,
      };

      style.layers.push({
        id: "buildings",
        type: "fill",
        source: "omsk",
        "source-layer": "omsk",
        paint: {
          "fill-color": ["case", ["has", "r_year_int"], yearStep, NO_DATA],
          "fill-opacity": 0.85,
        },
      });

      const map = new maplibregl.Map({
        container: "map",
        style,
        center: [73.3686, 54.9893],
        zoom: 13,
        doubleClickZoom: false,
      });

      map.addControl(new maplibregl.NavigationControl());

      const RANGE_MIN = 1771;
      const RANGE_MAX = 2026;
      const loInput = document.getElementById("year-lo");
      const hiInput = document.getElementById("year-hi");
      const rangeFill = document.getElementById("range-fill");
      const labelLo = document.getElementById("label-lo");
      const labelHi = document.getElementById("label-hi");

      let noDataVisible = true;

      const legend = document.getElementById("legend");
      legend.innerHTML =
        "<h4>Год постройки</h4>" +
        YEAR_RAMP.map(
          ({ label, color }, i) =>
            `<div class="row clickable" data-bin="${i}"><span class="sw" style="background:${color}"></span>${label}</div>`
        ).join("") +
        `<div class="row clickable" id="nodata-row"><span class="sw" style="background:${NO_DATA}"></span>нет данных</div>`;

      const yearInRange = () => [
        "case",
        ["has", "r_year_int"],
        [
          "all",
          [">=", ["get", "r_year_int"], Number(loInput.value)],
          ["<=", ["get", "r_year_int"], Number(hiInput.value)],
        ],
        false,
      ];

      const apply = () => {
        if (!map.isStyleLoaded()) return;
        const noData = ["!", ["has", "r_year_int"]];
        map.setFilter(
          "buildings",
          noDataVisible ? ["any", yearInRange(), noData] : yearInRange()
        );
      };

      const updateRangeVisual = () => {
        const lo = Number(loInput.value);
        const hi = Number(hiInput.value);
        const span = RANGE_MAX - RANGE_MIN;
        rangeFill.style.left = ((lo - RANGE_MIN) / span) * 100 + "%";
        rangeFill.style.width = ((hi - lo) / span) * 100 + "%";
        labelLo.textContent = lo;
        labelHi.textContent = hi;
      };

      loInput.addEventListener("input", () => {
        if (Number(loInput.value) > Number(hiInput.value)) {
          loInput.value = hiInput.value;
        }
        updateRangeVisual();
        apply();
      });

      hiInput.addEventListener("input", () => {
        if (Number(hiInput.value) < Number(loInput.value)) {
          hiInput.value = loInput.value;
        }
        updateRangeVisual();
        apply();
      });

      const setRangeFromBin = (i) => {
        const lo = YEAR_RAMP[i].from ?? RANGE_MIN;
        const nextFrom = YEAR_RAMP[i + 1]?.from;
        loInput.value = lo;
        hiInput.value = nextFrom !== undefined ? nextFrom - 1 : RANGE_MAX;
        updateRangeVisual();
        apply();
      };

      legend.querySelectorAll(".row[data-bin]").forEach((row) => {
        row.addEventListener("click", () => setRangeFromBin(Number(row.dataset.bin)));
      });

      document.getElementById("nodata-row").addEventListener("click", (event) => {
        noDataVisible = !noDataVisible;
        event.currentTarget.classList.toggle("active", !noDataVisible);
        apply();
      });

      map.on("load", () => {
        updateRangeVisual();
        apply();

        const popup = new maplibregl.Popup({ maxWidth: "320px" });

        map.on("click", "buildings", (event) => {
          const props = event.features[0].properties;
          const fields = [
            ["Год постройки", props.r_year_int],
            ["Этажность", props.r_floors],
            ["Информация", props.r_name],
          ].filter(
            ([, value]) =>
              value !== undefined && value !== null && value !== "" && value !== 0
          );

          const title = props.r_adress || props.r_name || "Здание";
          const body = fields
            .map(
              ([key, value]) =>
                `<div class="popup-row"><span class="popup-key">${key}:</span> ${escapeHtml(value)}</div>`
            )
            .join("");

          popup
            .setLngLat(event.lngLat)
            .setHTML(`<h4 class="popup-title">${escapeHtml(title)}</h4>${body}`)
            .addTo(map);
        });

        map.on("mouseenter", "buildings", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "buildings", () => {
          map.getCanvas().style.cursor = "";
        });
      });
    });
});
