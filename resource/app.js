// import GitHub from 'github-api';
// This is the starting value for the editor
// We will use this to seed the initial editor 
// and to provide a "Restore to Default" button.
repoUrl = "";
owner = "jr638091";
repo = 'jr638091.github.io';

var editor;
var dataset_info;

var data;

var csv = CSV.fetch({
  url: 'http://localhost:8000/resource/data.csv'
}).done(function (dataset) {
  console.log(dataset)
}).fail(function (error) {
  console.log(error)
});

OAuth.initialize('PVanBGV_sJB6pLh88oFohbI7CUQ');
var access_token;

OAuth.popup('github').fail(function (error) {
  console.log(error)
})
    .done(function (result) {
  access_token = result.access_token;
  $.getJSON(`https://api.github.com/repos/${owner}/${repo}/contents/resource/dataset.json`, { Authorization: `${access_token} OAUTH-TOKEN` }).done(function (data) {
    dataset_info = data;
    // Initialize the editor
    editor = new JSONEditor(document.getElementById('editor_holder'), {
      // Enable fetching schemas via ajax
      ajax: true,
      theme: 'bootstrap4',
      // The schema for the editor
      schema: {
        type: "array",
        title: "People",
        format: "tabs",
        items: {
          title: "Person",
          headerTemplate: "{{i}} - {{self.name}}",
          oneOf: [
            {
              $ref: "resource/basic_person.json",
              title: "Basic Person"
            },
            {
              $ref: "resource/person.json",
              title: "Complex Person"
            }
          ]
        }
      },

      // Seed the form with a starting value
      startval: JSON.parse(atob(data.content)),

      // Disable additional properties
      no_additional_properties: true,

      // Require all properties by default
      required_by_default: true
    });
    // Hook up the validation indicator to update its 
    // status whenever the editor changes
    editor.on('change', function () {
      // Get an array of errors from the validator
      var errors = editor.validate();

      var indicator = document.getElementById('valid_indicator');

      // Not valid
      if (errors.length) {
        indicator.style.color = 'red';
        indicator.textContent = "not valid";
      }
      // Valid
      else {
        indicator.style.color = 'green';
        indicator.textContent = "valid";
      }
    });
  });
  document.getElementById('pull_request').addEventListener('click', generatePullRequest);

  document.getElementById('submit').addEventListener('click', updateData);

// Hook up the enable/disable button
  document.getElementById('enable_disable').addEventListener('click', function () {
    // Enable form
    if (!editor.isEnabled()) {
      editor.enable();
    }
    // Disable form
    else {
      editor.disable();
    }
  });
});



function generatePullRequest() {
  var title = document.getElementById("titleInput").value;
  var body = document.getElementById("bodyInput").value;
  var base = document.getElementById("baseInput").value;
  var head = document.getElementById("headInput").value;
  var pullRequestJson = {
    "title": title,
    "body": body,
    "base": base,
    "head": head
  };
  pr = $.ajax({
    method: 'POST',
    url: `https://api.github.com/repos/${owner}/${repo}/pulls`,
    beforeSend: function(x) {
      if (x && x.overrideMimeType) {
        x.overrideMimeType("application/j-son;charset=UTF-8");
      }
    },
    headers: {
      Authorization: `Token ${access_token}`
    },
    dataType: "json",
    data: JSON.stringify(pullRequestJson)
  });

  pr.fail(function (err) {
    console.log(err);
  });
}

function updateData() {
  var saveData = editor.getValue();

  var myJSON = JSON.stringify(saveData);
  var encodedString = btoa(myJSON);
  json = {
    "content": encodedString,
    "message": `${repo} by ${owner} at ${Date.now()}`,
    "sha": dataset_info.sha
  };
  save = $.ajax({
    method: 'PUT',
    url: `https://api.github.com/repos/${owner}/${repo}/contents/resource/dataset.json`,
    beforeSend: function(x) {
      if (x && x.overrideMimeType) {
        x.overrideMimeType("application/j-son;charset=UTF-8");
      }
    },
    headers: {
      Authorization: `Token ${access_token}`
      // sha: dataset_info.sha
    },
    dataType: "json",
    data: JSON.stringify(json)
  });
  save.fail(function (err) {
    console.log(err);
  });
}