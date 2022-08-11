document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  


  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#compose-recipients').disabled = false;
  document.querySelector('#compose-subject').disabled = false;
  document.querySelector('#messages').innerHTML = "";

  // new
  document.querySelector('#compose-form').onsubmit = function() {
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
    // send 
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body
        })
      })
      .then(response => response.json())
      .then(result => {
          console.log(result);
          if(result['error']) {
            document.querySelector('#messages').innerHTML = `<div class="alert alert-danger" role="alert">${result['error']}</div>`;
          }
          else{
            load_mailbox('sent');
          }
      });

    return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#name').innerHTML = mailbox.charAt(0).toUpperCase() + mailbox.slice(1);
  //document.querySelector('#emails-view').innerHTML += `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // new
  document.getElementById("mails").innerHTML = "";
  let file = "emails/"+ mailbox;
  fetch (file)
  .then(response => response.json())
  .then(emails => {
      for (let i = 0; i < emails.length; i++) {
        let id = emails[i].id;
        let sender = emails[i].sender;
        let subject = emails[i].subject;
        let timestamp = emails[i].timestamp;
        if(!emails[i].read){
          document.getElementById("mails").innerHTML += `
          <div class="mail">
            <input type="hidden" value="${id}">
            <strong>${sender}</strong>
            <span>&nbsp &nbsp ${subject}</span>
            <span class="right">${timestamp}</span>
          </div>`;
        }
        else{
          document.getElementById("mails").innerHTML += `
          <div class="mail" style="background-color: rgb(206, 203, 203);">
            <input type="hidden" value="${id}">
            <strong>${sender}</strong>
            <span>&nbsp &nbsp ${subject}</span>
            <span class="right">${timestamp}</span>
          </div>`;
        }    
      }


    document.querySelectorAll('.mail').forEach(function(button) {
        button.onclick = function() {
            document.querySelector('#emails-view').style.display = 'none';
            document.querySelector('#compose-view').style.display = 'none';
            document.querySelector('#mail-view').style.display = 'block';
            let id = this.children[0].value;

            // view
            fetch('/emails/'+id)
            .then(response => response.json())
            .then(email => {
              archive_unarchive = "";
              if(mailbox == "inbox") {
                archive_unarchive = `<button onclick="archive(${id})" class="btn btn-sm btn-outline-primary archive">Archive</button>`;
              }
              else if(mailbox == "archive"){
                archive_unarchive = `<button onclick="unarchive(${id})" class="btn btn-sm btn-outline-primary unarchive">Unarchive</button>`;
              }
              document.querySelector('#mail-view').innerHTML = `
              <div>
                <div><strong>From:</strong> ${email.sender}</div>
                <div><strong>To:</strong> ${email.recipients}</div>
                <div><strong>Subject:</strong> ${email.subject}</div>
                <div><strong>Timestamp:</strong> ${email.timestamp}</div>
                <button onclick="reply(${id})" class="btn btn-sm btn-outline-primary">Reply</button>
                ${archive_unarchive}
                <hr>
                <div>${email.body}</div>
              </div>`;
            });

            // read
            fetch('/emails/'+id, {
              method: 'PUT',
              body: JSON.stringify({
                  read: true
              })
            })

            

        }
    });
    

  });

}

// Archive
function archive(id) {
  fetch('/emails/'+id, {
            method: 'PUT',
            body: JSON.stringify({
              archived: true
            })
          })
 load_mailbox('inbox');
}

// Unarchive
function unarchive(id) {
  fetch('/emails/'+id, {
            method: 'PUT',
            body: JSON.stringify({
              archived: false
            })
          })
  load_mailbox('inbox');
}

// repy
function reply(id){
  compose_email();
  fetch('/emails/'+id)
  .then(response => response.json())
  .then(email => {
    let recipients = email.sender;
    let subject = email.subject;
    let timestamp = email.timestamp;
    let body = email.body;
    document.querySelector('#compose-recipients').value = recipients;
    document.querySelector('#compose-recipients').disabled = true;
    if(!subject.startsWith("re:")){
      document.querySelector('#compose-subject').value = "re: "+subject;
    }
    else{
      document.querySelector('#compose-subject').value = subject;
    }
    document.querySelector('#compose-subject').disabled = true;
    document.querySelector('#compose-body').value = "On "+timestamp+" wrote: "+body;
    
  });
}