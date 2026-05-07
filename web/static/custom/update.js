// all the functions related to reNgine update, including showing up modal, notification etc will be here

// Source : https://stackoverflow.com/a/32428268
function checkDailyUpdate() {
  if (!hasOneDayPassed()) return false;
  console.log("Checking Daily Update...");
  fetch("/api/rengine/update/")
    .then((response) => response.json())
    .then(function (response) {
      if (response["update_available"]) {
        window.localStorage.setItem("update_available", true);
        window.localStorage.setItem("update_redirect_link", response["redirect_link"]);
        $(".rengine_update_available").show();
        update_available(response["latest_version"], response["changelog"], response["redirect_link"]);
      } else {
        window.localStorage.setItem("update_available", false);
        $(".rengine_update_available").hide();
      }

      if (response["v3_available"]) {
        v3_update_available(response["v3_version"], response["v3_changelog"]);
      }
    });
}

function check_rengine_update() {
  if (
    window.localStorage.getItem("update_available") &&
    window.localStorage.getItem("update_available") === "true"
  ) {
    // redirect to the link provided by api or default to releases
    const redirectLink = window.localStorage.getItem("update_redirect_link") || "https://github.com/whiterabb17/rengine/releases";
    window.open(redirectLink, "_blank");
  } else {
    Swal.fire({
      title: "Checking reNgine latest version...",
      allowOutsideClick: false,
    });
    swal.showLoading();
    fetch("/api/rengine/update/")
      .then((response) => response.json())
      .then(function (response) {
        console.log(response);
        swal.close();
        if (response["message"] == "RateLimited") {
          Swal.fire({
            title: "Oops!",
            text: "Github rate limit exceeded, please try again in an hour!",
            icon: "error",
          });
          window.localStorage.setItem("update_available", false);
          $(".rengine_update_available").hide();
        } else if (response["update_available"]) {
          window.localStorage.setItem("update_available", true);
          window.localStorage.setItem("update_redirect_link", response["redirect_link"]);
          $(".rengine_update_available").show();
          update_available(response["latest_version"], response["changelog"], response["redirect_link"]);
        } else {
          window.localStorage.setItem("update_available", false);
          $(".rengine_update_available").hide();
          if (!response["v3_available"]) {
            Swal.fire({
              title: "Update not available",
              text: "You are running the latest version of reNgine!",
              icon: "info",
            });
          }
        }

        if (response["v3_available"]) {
          v3_update_available(response["v3_version"], response["v3_changelog"]);
        }
      });
  }
}

function update_available(latest_version_number, changelog, redirect_link) {
  // Ensure marked and highlight.js are loaded, to render the changelog
  Promise.all([
    loadScript("https://cdn.jsdelivr.net/npm/marked/marked.min.js"),
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"
    ),
    loadCSS(
      "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github.min.css"
    ),
  ]).then(() => {
    marked.setOptions({
      highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: "hljs language-",
    });

    const parsedChangelog = marked.parse(changelog);

    const changelogStyle = `
        <style>
          .changelog-content {
             background-color: #f8f9fa;
             border-radius: 8px;
             padding: 20px;
             font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
             text-align: left;
           }
           .changelog-content h1, .changelog-content h2 {
             border-bottom: 1px solid #eaecef;
             padding-bottom: 0.3em;
           }
           .changelog-content pre {
             background-color: #f6f8fa;
             border-radius: 6px;
             padding: 16px;
           }
           .changelog-content code {
             background-color: rgba(27,31,35,.05);
             border-radius: 3px;
             font-size: 85%;
             margin: 0;
             padding: .2em .4em;
           }
         </style>
       `;

    Swal.fire({
      title: "Update Available!",
      html: `
           ${changelogStyle}
           <h5>reNgine's new update ${latest_version_number} is available, please follow the update instructions.</h5>
           <div class="changelog-content" style="max-height: 500px;" data-simplebar>
             ${parsedChangelog}
           </div>
         `,
      icon: "info",
      confirmButtonText: "Update Now",
      showCancelButton: true,
      cancelButtonText: "Dismiss",
      width: "70%",
      didOpen: () => {
        document.querySelectorAll("pre code").forEach((block) => {
          hljs.highlightBlock(block);
        });
      },
    }).then((result) => {
      if (result.isConfirmed) {
        window.open(redirect_link || "https://github.com/whiterabb17/rengine/releases", "_blank");
      }
    });
  });
}

function v3_update_available(v3_version, changelog) {
  // Ensure marked and highlight.js are loaded
  Promise.all([
    loadScript("https://cdn.jsdelivr.net/npm/marked/marked.min.js"),
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"
    ),
    loadCSS(
      "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github.min.css"
    ),
  ]).then(() => {
    marked.setOptions({
      highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: "hljs language-",
    });

    const parsedChangelog = changelog
      ? marked.parse(changelog)
      : "<p>No changelog available.</p>";

    const changelogStyle = `
        <style>
          .changelog-content {
             background-color: #f8f9fa;
             border-radius: 8px;
             padding: 20px;
             font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
             text-align: left;
           }
           .changelog-content h1, .changelog-content h2 {
             border-bottom: 1px solid #eaecef;
             padding-bottom: 0.3em;
           }
           .changelog-content pre {
             background-color: #f6f8fa;
             border-radius: 6px;
             padding: 16px;
           }
           .changelog-content code {
             background-color: rgba(27,31,35,.05);
             border-radius: 3px;
             font-size: 85%;
             margin: 0;
             padding: .2em .4em;
           }
         </style>
       `;

    Swal.fire({
      title: "reNgine v3 is here!",
      html: `
           ${changelogStyle}
           <h4 class="mb-3">A major upgrade is available!</h4>
           <p>reNgine v3 version <b>${v3_version}</b> has been released with a complete React rewrite, enhanced performance, and a stunning new look.</p>
           <div class="changelog-content" style="max-height: 400px; overflow-y: auto;" data-simplebar>
             ${parsedChangelog}
           </div>
           <div class="alert alert-info text-start mt-3">
             <i class="fe-info me-1"></i> reNgine v3 is a complete overhaul. Please follow the migration guide in the new repository.
           </div>
         `,
      icon: "success",
      confirmButtonText: "View v3 Repository",
      showCancelButton: true,
      cancelButtonText: "Maybe Later",
      width: "70%",
      didOpen: () => {
        document.querySelectorAll("pre code").forEach((block) => {
          hljs.highlightBlock(block);
        });
      },
    }).then((result) => {
      if (result.isConfirmed) {
        window.open("https://github.com/whiterabb17/r3ngine", "_blank");
      }
    });
  });
}

// Source: https://stackoverflow.com/a/32428268
function hasOneDayPassed() {
  var date = new Date().toLocaleDateString();
  if (window.localStorage.getItem("last_update_checked") == date) {
    return false;
  }
  window.localStorage.setItem("last_update_checked", date);
  return true;
}

function showAfterUpdatePopup() {
  // this function will show a popup after the update is done to tell user about the new features
  const currentVersion = document.body.getAttribute("data-rengine-version");
  const lastShownVersion = localStorage.getItem("lastShownUpdateVersion");

  if (lastShownVersion !== currentVersion) {
    // const isFirstRun = lastShownVersion === null;
    // we will use this once videos are made for features
    // Swal.fire({
    //   title: isFirstRun ? "Welcome to reNgine!" : "Thanks for updating!",
    //   text: `Would you like to see ${
    //     isFirstRun ? "the features" : "what's changed"
    //   } in this version?`,
    //   icon: "info",
    //   showCancelButton: true,
    //   confirmButtonText: "Yes, show me",
    //   cancelButtonText: "No, thanks",
    // }).then((result) => {
    //   if (result.isConfirmed) {
    //     window.open("https://rengine.wiki/changelog/latest", "_blank");
    //   }
    //   localStorage.setItem("lastShownUpdateVersion", currentVersion);
    // });
    Swal.fire({
      title: "Thanks for using reNgine!",
      text: `Would you like to see what's new in version ${currentVersion}?`,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Yes, show me",
      cancelButtonText: "No, thanks",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch("/api/getFileContents/?changelog=true")
          .then((response) => response.json())
          .then((data) => {
            if (data.status) {
              displayChangelogOverlay(currentVersion, data.content);
            } else {
              window.open(
                `https://rengine.wiki/whats-new/${currentVersion.replace(
                  /\./g,
                  "_"
                )}`,
                "_blank"
              );
            }
          });
      }
      localStorage.setItem("lastShownUpdateVersion", currentVersion);
    });
  }
}

function displayChangelogOverlay(version, changelog) {
  Promise.all([
    loadScript("https://cdn.jsdelivr.net/npm/marked/marked.min.js"),
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"
    ),
    loadCSS(
      "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github.min.css"
    ),
  ]).then(() => {
    marked.setOptions({
      highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: "hljs language-",
    });

    const parsedChangelog = marked.parse(changelog);

    const changelogStyle = `
        <style>
          .changelog-content {
             background-color: #f8f9fa;
             border-radius: 8px;
             padding: 20px;
             font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
             text-align: left;
           }
           .changelog-content h1, .changelog-content h2 {
             border-bottom: 1px solid #eaecef;
             padding-bottom: 0.3em;
           }
           .changelog-content pre {
             background-color: #f6f8fa;
             border-radius: 6px;
             padding: 16px;
           }
           .changelog-content code {
             background-color: rgba(27,31,35,.05);
             border-radius: 3px;
             font-size: 85%;
             margin: 0;
             padding: .2em .4em;
           }
         </style>
       `;

    Swal.fire({
      title: `What's new in reNgine ${version}`,
      html: `
           ${changelogStyle}
           <div class="changelog-content" style="max-height: 500px; overflow-y: auto;" data-simplebar>
             ${parsedChangelog}
           </div>
         `,
      icon: "info",
      confirmButtonText: "Awesome!",
      width: "70%",
      didOpen: () => {
        document.querySelectorAll("pre code").forEach((block) => {
          hljs.highlightBlock(block);
        });
      },
    });
  });
}

$(document).ready(function () {
  // show popup after update
  showAfterUpdatePopup();
  // hide badge if update does not exists
  if (
    window.localStorage.getItem("update_available") &&
    window.localStorage.getItem("update_available") === "true"
  ) {
    $(".rengine_update_available").show();
  } else {
    $(".rengine_update_available").hide();
  }
});
