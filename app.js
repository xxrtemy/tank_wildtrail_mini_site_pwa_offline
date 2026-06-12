var STORAGE_KEY = "tank_wildtrail_records_v20";
      var MEMORY_RECORDS = [];
      var storageMode = "localStorage";

      function byId(id) {
        return document.getElementById(id);
      }

      function showStatus(message, isError) {
        var el = byId("status");
        if (!el) {
          return;
        }
        el.style.color = isError ? "#ff8c8c" : "#9fe59f";
        el.innerHTML = message;
      }

      function safeParse(jsonText) {
        try {
          return JSON.parse(jsonText || "[]") || [];
        } catch (e) {
          return [];
        }
      }

      function loadRecords() {
        var data = null;
        try {
          data = window.localStorage.getItem(STORAGE_KEY);
          if (data) {
            MEMORY_RECORDS = safeParse(data);
            storageMode = "localStorage";
            return MEMORY_RECORDS;
          }
        } catch (e1) {}

        try {
          if (window.name && window.name.indexOf(STORAGE_KEY + ":") === 0) {
            data = window.name.substring((STORAGE_KEY + ":").length);
            MEMORY_RECORDS = safeParse(data);
            storageMode = "window";
            return MEMORY_RECORDS;
          }
        } catch (e2) {}

        storageMode = "memory";
        return MEMORY_RECORDS;
      }

      function saveRecords(records) {
        MEMORY_RECORDS = records;
        var serialized = JSON.stringify(records);

        try {
          window.localStorage.setItem(STORAGE_KEY, serialized);
          storageMode = "localStorage";
          return true;
        } catch (e1) {}

        try {
          window.name = STORAGE_KEY + ":" + serialized;
          storageMode = "window";
          return true;
        } catch (e2) {}

        storageMode = "memory";
        return true;
      }

      function updateCounter() {
        var count = loadRecords().length;
        var el = byId("counter");
        if (el) {
          var suffix =
            storageMode === "memory"
              ? " — сохранение только до закрытия вкладки"
              : "";
          el.innerHTML = "Сохранено регистраций: " + count + suffix;
        }
      }

      function onlyDigits(value) {
        return String(value || "").replace(/\D/g, "");
      }

      function nationalPhoneDigits(raw) {
        var digits = onlyDigits(raw);

        if (
          digits.length > 10 &&
          (digits.charAt(0) === "7" || digits.charAt(0) === "8")
        ) {
          digits = digits.substring(1);
        }

        while (
          digits.length > 0 &&
          (digits.charAt(0) === "7" || digits.charAt(0) === "8")
        ) {
          digits = digits.substring(1);
        }

        if (digits.length > 10) {
          digits = digits.substring(0, 10);
        }
        return digits;
      }

      function formatNationalPhone(raw) {
        var d = nationalPhoneDigits(raw);
        var out = "";
        if (d.length > 0) {
          out += "(" + d.substring(0, 3);
        }
        if (d.length >= 3) {
          out += ") ";
        }
        if (d.length > 3) {
          out += d.substring(3, 6);
        }
        if (d.length >= 6) {
          out += "-";
        }
        if (d.length > 6) {
          out += d.substring(6, 8);
        }
        if (d.length >= 8) {
          out += "-";
        }
        if (d.length > 8) {
          out += d.substring(8, 10);
        }
        return out;
      }

      function fullPhone() {
        var d = nationalPhoneDigits(byId("phone").value);
        return d ? "+7 " + formatNationalPhone(d) : "+7";
      }

      function onPhoneInput() {
        var p = byId("phone");
        p.value = formatNationalPhone(p.value);
      }

      function isEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
      }

      function validateForm() {
        var firstName = byId("firstName").value.replace(/^\s+|\s+$/g, "");
        var phoneDigits = nationalPhoneDigits(byId("phone").value);
        var email = byId("email").value.replace(/^\s+|\s+$/g, "");
        var errors = [];

        if (!firstName) {
          errors.push("Введите имя.");
        }
        if (phoneDigits.length !== 10) {
          errors.push("Введите 10 цифр телефона после +7.");
        }
        if (!email || !isEmail(email)) {
          errors.push("Введите корректный E-mail.");
        }
        if (!byId("policyConsent").checked) {
          errors.push(
            "Подтвердите ознакомление с политикой обработки персональных данных."
          );
        }
        if (!byId("personalDataConsent").checked) {
          errors.push("Подтвердите согласие на обработку персональных данных.");
        }
        if (!byId("communicationConsent").checked) {
          errors.push("Подтвердите согласие на коммуникацию.");
        }
        if (!byId("thirdPartyConsent").checked) {
          errors.push(
            "Подтвердите согласие на предоставление персональных данных третьим лицам."
          );
        }

        if (errors.length) {
          showStatus(errors.join("<br>"), true);
          try {
            byId("status").scrollIntoView();
          } catch (e) {}
          return false;
        }
        return true;
      }

      function formatDateTime(date) {
        function pad(n) {
          return n < 10 ? "0" + n : "" + n;
        }
        return (
          pad(date.getDate()) +
          "." +
          pad(date.getMonth() + 1) +
          "." +
          date.getFullYear() +
          ", " +
          pad(date.getHours()) +
          ":" +
          pad(date.getMinutes()) +
          ":" +
          pad(date.getSeconds())
        );
      }

      function saveForm() {
        showStatus("Кнопка нажалась. Проверяю поля…", false);
        if (!validateForm()) {
          return false;
        }

        var records = loadRecords();
        records.push({
          createdAt: formatDateTime(new Date()),
          firstName: byId("firstName").value.replace(/^\s+|\s+$/g, ""),
          lastName: byId("lastName").value.replace(/^\s+|\s+$/g, ""),
          phone: fullPhone(),
          email: byId("email").value.replace(/^\s+|\s+$/g, ""),
          policyConsent: byId("policyConsent").checked ? "Да" : "Нет",
          personalDataConsent: byId("personalDataConsent").checked
            ? "Да"
            : "Нет",
          communicationConsent: byId("communicationConsent").checked
            ? "Да"
            : "Нет",
          thirdPartyConsent: byId("thirdPartyConsent").checked ? "Да" : "Нет"
        });

        saveRecords(records);

        byId("registrationForm").reset();
        byId("phone").value = "";
        updateCounter();
        renderVisibleRecords(records);
        showStatus(
          "Заявка сохранена. Данные показаны ниже в таблице и в поле для копирования.",
          false
        );

        // После отправки сразу показываем данные на странице. Без модальных окон.
        showLastSavedRecord(records[records.length - 1], records.length);
        try {
          byId("visibleDataPanel").scrollIntoView();
        } catch (e) {}

        return false;
      }

      function csvEscape(value) {
        var str = String(value == null ? "" : value);
        if (/[";\n]/.test(str)) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }

      function buildCsv(records) {
        var rows = [
          [
            "Дата и время регистрации",
            "Имя",
            "Фамилия",
            "Телефон",
            "E-mail",
            "Политика ПД",
            "Согласие на обработку ПД",
            "Согласие на коммуникацию",
            "Согласие на передачу третьим лицам"
          ]
        ];

        for (var i = 0; i < records.length; i++) {
          var item = records[i];
          rows.push([
            item.createdAt,
            item.firstName,
            item.lastName,
            item.phone,
            item.email,
            item.policyConsent,
            item.personalDataConsent,
            item.communicationConsent,
            item.thirdPartyConsent
          ]);
        }

        var lines = [];
        for (var r = 0; r < rows.length; r++) {
          var cells = [];
          for (var c = 0; c < rows[r].length; c++) {
            cells.push(csvEscape(rows[r][c]));
          }
          lines.push(cells.join(";"));
        }
        return lines.join("\n");
      }

      function htmlEscape(value) {
        var str = String(value == null ? "" : value);
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      }

      function buildExcelHtml(records) {
        var headers = [
          "Дата и время регистрации",
          "Имя",
          "Фамилия",
          "Телефон",
          "E-mail",
          "Политика ПД",
          "Согласие на обработку ПД",
          "Согласие на коммуникацию",
          "Согласие на передачу третьим лицам"
        ];

        var html =
          '<html><head><meta charset="UTF-8"></head><body><table border="1"><tr>';
        for (var h = 0; h < headers.length; h++) {
          html += "<th>" + htmlEscape(headers[h]) + "</th>";
        }
        html += "</tr>";

        for (var i = 0; i < records.length; i++) {
          var item = records[i];
          var row = [
            item.createdAt,
            item.firstName,
            item.lastName,
            item.phone,
            item.email,
            item.policyConsent,
            item.personalDataConsent,
            item.communicationConsent,
            item.thirdPartyConsent
          ];
          html += "<tr>";
          for (var c = 0; c < row.length; c++) {
            html += "<td>" + htmlEscape(row[c]) + "</td>";
          }
          html += "</tr>";
        }

        html += "</table></body></html>";
        return html;
      }

      function makeDownloadLink(linkId, content, mimeType, fileName) {
        var link = byId(linkId);
        if (!link) {
          return null;
        }

        link.download = fileName;

        try {
          var blob = new Blob([content], { type: mimeType });
          var url = URL.createObjectURL(blob);
          link.href = url;
        } catch (e1) {
          try {
            link.href =
              "data:" +
              mimeType +
              ";charset=utf-8," +
              encodeURIComponent(content);
          } catch (e2) {
            link.href = "#";
          }
        }

        return link;
      }

      function prepareExport(records, autoDownload) {
        var csv = buildCsv(records);
        var excelHtml = buildExcelHtml(records);

        var textarea = byId("exportTextarea");
        if (textarea) {
          textarea.value = csv;
        }

        var stamp = new Date();
        function pad(n) {
          return n < 10 ? "0" + n : "" + n;
        }
        var fileDate =
          stamp.getFullYear() +
          "-" +
          pad(stamp.getMonth() + 1) +
          "-" +
          pad(stamp.getDate()) +
          "_" +
          pad(stamp.getHours()) +
          "-" +
          pad(stamp.getMinutes());

        var xlsLink = makeDownloadLink(
          "downloadXlsLink",
          excelHtml,
          "application/vnd.ms-excel;charset=utf-8;",
          "tank_wildtrail_registrations_" + fileDate + ".xls"
        );

        makeDownloadLink(
          "downloadCsvLink",
          "\uFEFF" + csv,
          "text/csv;charset=utf-8;",
          "tank_wildtrail_registrations_" + fileDate + ".csv"
        );

        byId("exportModalBackdrop").className = "modal-backdrop active";

        // Важно для iPhone/iPad: попытка скачивания идет сразу внутри пользовательского действия.
        // Если Safari/предпросмотр блокирует скачивание, окно с кнопками и данными всё равно останется открытым.
        if (autoDownload && xlsLink) {
          try {
            xlsLink.click();
          } catch (e) {}
        }

        return false;
      }

      function escapeTableCell(value) {
        return htmlEscape(value == null ? "" : value);
      }

      function updateVisibleDownloadLinks(records) {
        var csv = buildCsv(records);
        var excelHtml = buildExcelHtml(records);

        var stamp = new Date();
        function pad(n) {
          return n < 10 ? "0" + n : "" + n;
        }
        var fileDate =
          stamp.getFullYear() +
          "-" +
          pad(stamp.getMonth() + 1) +
          "-" +
          pad(stamp.getDate()) +
          "_" +
          pad(stamp.getHours()) +
          "-" +
          pad(stamp.getMinutes());

        makeDownloadLink(
          "visibleDownloadXlsLink",
          excelHtml,
          "application/vnd.ms-excel;charset=utf-8;",
          "tank_wildtrail_registrations_" + fileDate + ".xls"
        );

        makeDownloadLink(
          "visibleDownloadCsvLink",
          "\uFEFF" + csv,
          "text/csv;charset=utf-8;",
          "tank_wildtrail_registrations_" + fileDate + ".csv"
        );
      }

      function showLastSavedRecord(item, count) {
        var status = byId("saveDebugStatus");
        var card = byId("lastRecordCard");

        if (status) {
          status.innerHTML =
            "Заявка принята и показана ниже. Всего заявок в этой вкладке: " +
            count +
            ". Способ сохранения: " +
            storageMode +
            ".";
        }

        if (card && item) {
          card.style.display = "block";
          card.innerHTML =
            "<strong>Последняя отправленная заявка</strong><br>" +
            "Имя: " +
            escapeTableCell(item.firstName) +
            "<br>" +
            "Фамилия: " +
            escapeTableCell(item.lastName || "—") +
            "<br>" +
            "Телефон: " +
            escapeTableCell(item.phone) +
            "<br>" +
            "E-mail: " +
            escapeTableCell(item.email) +
            "<br>" +
            "Время: " +
            escapeTableCell(item.createdAt);
        }
      }

      function renderVisibleRecords(recordsOverride) {
        var records = recordsOverride || loadRecords();
        var tableWrap = byId("visibleRecordsTable");
        var textarea = byId("visibleCsvTextarea");

        if (!tableWrap || !textarea) {
          return;
        }

        if (!records.length) {
          tableWrap.innerHTML =
            '<div class="visible-records-empty">Пока нет сохранённых заявок. После нажатия «Отправить» данные появятся здесь.</div>';
          textarea.value = "";
          updateVisibleDownloadLinks([]);
          return;
        }

        var headers = [
          "№",
          "Дата и время",
          "Имя",
          "Фамилия",
          "Телефон",
          "E-mail",
          "Политика",
          "ПД",
          "Коммуникация",
          "Третьи лица"
        ];

        var out = '<table class="visible-records-table"><thead><tr>';
        for (var h = 0; h < headers.length; h++) {
          out += "<th>" + escapeTableCell(headers[h]) + "</th>";
        }
        out += "</tr></thead><tbody>";

        for (var i = 0; i < records.length; i++) {
          var item = records[i];
          var row = [
            i + 1,
            item.createdAt,
            item.firstName,
            item.lastName,
            item.phone,
            item.email,
            item.policyConsent,
            item.personalDataConsent,
            item.communicationConsent,
            item.thirdPartyConsent
          ];
          out += "<tr>";
          for (var c = 0; c < row.length; c++) {
            out += "<td>" + escapeTableCell(row[c]) + "</td>";
          }
          out += "</tr>";
        }

        out += "</tbody></table>";
        tableWrap.innerHTML = out;
        textarea.value = buildCsv(records);
        updateVisibleDownloadLinks(records);
      }

      function refreshVisibleData() {
        renderVisibleRecords();
        showStatus("Таблица обновлена.", false);
        return false;
      }

      function selectVisibleCsv() {
        var textarea = byId("visibleCsvTextarea");
        if (!textarea) {
          return false;
        }
        textarea.focus();
        textarea.select();
        return false;
      }

      function copyVisibleCsv() {
        var textarea = byId("visibleCsvTextarea");
        if (!textarea || !textarea.value) {
          alert("Пока нет данных для копирования");
          return false;
        }
        textarea.focus();
        textarea.select();
        try {
          document.execCommand("copy");
          alert("Данные скопированы");
        } catch (e) {
          alert(
            "Если копирование не сработало, выделите текст вручную и нажмите «Скопировать»."
          );
        }
        return false;
      }

      function exportToCsv() {
        var records = loadRecords();
        if (!records.length) {
          showStatus(
            "Нет данных для экспорта. Сначала отправьте хотя бы одну заявку.",
            true
          );
          alert("Нет данных для экспорта");
          return false;
        }

        renderVisibleRecords();
        return prepareExport(records, false);
      }

      function selectCsv() {
        var textarea = byId("exportTextarea");
        textarea.focus();
        textarea.select();
      }

      function copyCsvToClipboard() {
        var textarea = byId("exportTextarea");
        textarea.focus();
        textarea.select();
        try {
          document.execCommand("copy");
          alert("Данные скопированы");
        } catch (e) {
          alert(
            "Если копирование не сработало, выделите текст вручную и скопируйте."
          );
        }
      }

      function clearAllData() {
        if (!confirm("Удалить все сохранённые регистрации?")) {
          return false;
        }
        MEMORY_RECORDS = [];
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch (e1) {}
        try {
          window.name = "";
        } catch (e2) {}
        updateCounter();
        renderVisibleRecords();
        showStatus("Все данные удалены.", false);
        return false;
      }

      function openDoc(key) {
        var anchor = key === "third_party" ? "third-party" : key;
        var el = byId("doc-" + anchor);
        if (el) {
          el.open = true;
          try {
            el.scrollIntoView();
          } catch (e) {}
        }
        return false;
      }

      function closeDocModal() {
        return false;
      }

      function closeExportModal() {
        byId("exportModalBackdrop").className = "modal-backdrop";
        return false;
      }

      function updateOfflineStatus(message, warn) {
        var el = byId("offlineStatus");
        if (!el) {
          return;
        }
        el.innerHTML = message;
        if (warn) {
          el.className = "offline-status warn";
        } else {
          el.className = "offline-status";
        }
      }

      var offlineModeReady = false;

      function showOfflineReadyStatus() {
        offlineModeReady = true;
        updateOfflineStatus(
          "Офлайн-режим полностью готов. Сайт можно открыть и использовать без интернета на этом устройстве.",
          false
        );
      }

      function checkOfflineReadiness(worker) {
        if (!worker || typeof MessageChannel === "undefined") {
          return;
        }

        var channel = new MessageChannel();
        var timeout = window.setTimeout(function () {
          channel.port1.onmessage = null;
        }, 5000);

        channel.port1.onmessage = function (event) {
          window.clearTimeout(timeout);
          if (event.data && event.data.offlineReady) {
            showOfflineReadyStatus();
          } else {
            updateOfflineStatus(
              "Офлайн-режим ещё готовится. Не закрывайте страницу и оставьте интернет включённым.",
              false
            );
          }
        };

        worker.postMessage(
          { type: "CHECK_OFFLINE_READY" },
          [channel.port2]
        );
      }

      function registerOfflineMode() {
        if (!("serviceWorker" in navigator)) {
          updateOfflineStatus(
            "Офлайн-режим: этот способ открытия не поддерживает Service Worker. Откройте сайт по https-ссылке в Safari.",
            true
          );
          return;
        }

        if (
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname === "localhost"
        ) {
          navigator.serviceWorker.getRegistrations().then(function (registrations) {
            for (var i = 0; i < registrations.length; i++) {
              registrations[i].unregister();
            }
          });
          updateOfflineStatus(
            "Локальный режим разработки: офлайн-кеш отключён.",
            false
          );
          return;
        }

        try {
          navigator.serviceWorker
            .register("./sw.js")
            .then(function (reg) {
              updateOfflineStatus(
                "Офлайн-режим готовится. После первого открытия с интернетом сайт сможет работать без интернета на этом устройстве.",
                false
              );
              if (reg && reg.update) {
                try {
                  reg.update();
                } catch (e) {}
              }

              navigator.serviceWorker.ready.then(function (readyReg) {
                checkOfflineReadiness(readyReg.active);
              });
            })
            .catch(function () {
              updateOfflineStatus(
                "Офлайн-режим не включился. Проверьте, что сайт открыт по https-ссылке в Safari, а не как локальный файл.",
                true
              );
            });
        } catch (e) {
          updateOfflineStatus(
            "Офлайн-режим не включился. Откройте сайт по https-ссылке в Safari.",
            true
          );
        }

        window.addEventListener("online", function () {
          if (offlineModeReady) {
            showOfflineReadyStatus();
          } else {
            updateOfflineStatus(
              "Интернет есть. Офлайн-режим ещё готовится.",
              false
            );
          }
        });

        window.addEventListener("offline", function () {
          if (offlineModeReady) {
            updateOfflineStatus(
              "Интернета нет. Офлайн-режим полностью готов, форма продолжает работать.",
              false
            );
          } else {
            updateOfflineStatus(
              "Интернета нет, но полная готовность офлайн-режима не была подтверждена.",
              true
            );
          }
        });
      }

      function initForm() {
        var actions = {
          "refresh-visible-data": refreshVisibleData,
          "copy-visible-csv": copyVisibleCsv,
          "select-visible-csv": selectVisibleCsv,
          "export-to-csv": exportToCsv,
          "clear-all-data": clearAllData,
          "close-export-modal": closeExportModal,
          "copy-export-csv": copyCsvToClipboard,
          "select-export-csv": selectCsv
        };

        document.addEventListener("click", function (event) {
          var target = event.target;
          while (target && target !== document) {
            var action = target.getAttribute
              ? target.getAttribute("data-action")
              : null;
            if (action && actions[action]) {
              event.preventDefault();
              actions[action]();
              return;
            }
            target = target.parentNode;
          }
        });

        var p = byId("phone");
        if (p) {
          p.oninput = onPhoneInput;
          p.onkeyup = onPhoneInput;
          p.onchange = onPhoneInput;
        }

        // Документы открываются нативными details-блоками.

        var exportBackdrop = byId("exportModalBackdrop");
        if (exportBackdrop) {
          exportBackdrop.onclick = function (e) {
            e = e || window.event;
            if (e.target === exportBackdrop) {
              closeExportModal();
            }
          };
        }

        registerOfflineMode();

        var fallbackNotice = byId("jsFallbackNotice");
        if (fallbackNotice) {
          fallbackNotice.style.display = "none";
        }

        updateCounter();
        renderVisibleRecords();

        var sendButton = byId("sendButton");
        if (sendButton) {
          sendButton.disabled = false;
          sendButton.addEventListener("click", function () {
            saveForm();
          });
        }

        var form = byId("registrationForm");
        if (form) {
          form.addEventListener("submit", function (event) {
            event.preventDefault();
            saveForm();
          });
        }
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initForm);
      } else {
        initForm();
      }
