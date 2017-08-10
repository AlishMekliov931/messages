function startApp() {
    // const
    const appKay = 'kid_Hk4SphWPW';
    const appSecret = '79d2e076e0f74ebbb708f37cda5868cc';
    const baseUrl = 'https://baas.kinvey.com';

    //initial
    showNavigationLinks();
    showViewHome();
    notification();

    // navigation link
    $('#linkMenuAppHome').click(showViewHome);
    $('#linkMenuLogin').click(showViewLogin);
    $('#linkMenuRegister').click(showViewRegister);

    $('#linkMenuUserHome').click(showViewHome);
    $('#linkMenuMyMessages, #linkUserHomeMyMessages').click(showViewMyMessages);
    $('#linkMenuArchiveSent, #linkUserHomeArchiveSent').click(showViewArchiveSent);
    $('#linkMenuSendMessage, #linkUserHomeSendMessage').click(showViewSendMessage);
    $('#linkMenuLogout').click(logout);


    $("form").submit(function (e) {
        e.preventDefault()
    });

    // Bind the form submit buttons
    $("#formRegister").submit(register);
    $("#formLogin").submit(login);
    $("#formSendMessage").submit(sendMessage);

    function showNavigationLinks() {
        $('#menu').find('a').hide();
        if (sessionStorage.getItem('authtoken')) {
            $('.useronly').show();
        } else {
            $('.anonymous').show()
        }
    }

    function showView(viewName) {
        $('section').hide();
        $('#' + viewName).show();
    }

    // show view functions
    function showViewHome() {
        $("section").hide();
        let username = sessionStorage.getItem('username');
        if (username) {
            showView('viewUserHome');
            $('#spanMenuLoggedInUser, #viewUserHomeHeading').text(`Welcome, ${username}!`);
        } else {
            showView('viewAppHome');
            $('#spanMenuLoggedInUser, #viewUserHomeHeading').text(``);
        }
    }

    function showViewLogin() {
        $('#formLogin').trigger('reset');
        showView('viewLogin');
    }

    function showViewRegister() {
        $('#formRegister').trigger('reset');
        showView('viewRegister');
    }

    function showViewMyMessages() {
        showView('viewMyMessages');
        listMessages()
    }

    function showViewArchiveSent() {
        showView('viewArchiveSent');
        listArchive()
    }

    function showViewSendMessage() {
        showView('viewSendMessage');
        loadRecipient();

    }

    // main logic
    function register() {
        let registerForm = $('#formRegister');
        let username = registerForm.find('input[name=username]').val();
        let password = registerForm.find('input[name=password]').val();
        let name = registerForm.find('input[name=name]').val();

        $.ajax({
            url: baseUrl + "/user/" + appKay,
            method: 'POST',
            headers: {
                "Authorization": "Basic " + btoa(appKay + ":" + appSecret),
                "Content-Type": "application/json"
            },
            data: JSON.stringify({
                username,
                password,
                name
            }),
            success: successRegister,
            error: handleError
        });

        function successRegister(data) {
            saveSession(data);
            showNavigationLinks();
            showInfo('User registration successful.');
            showViewHome();
        }

    }

    function login() {

        let registerForm = $('#formLogin');
        let username = registerForm.find('input[name=username]').val();
        let password = registerForm.find('input[name=password]').val();

        $.ajax({
            url: baseUrl + "/user/" + appKay + '/login',
            method: 'POST',
            headers: {
                "Authorization": "Basic " + btoa(appKay + ":" + appSecret),
                "Content-Type": "application/json"
            },
            data: JSON.stringify({
                username,
                password,
            }),
            success: successLogin,
            error: handleError
        });

        function successLogin(data) {
            saveSession(data);
            showNavigationLinks();
            showInfo('Login successful.');
            showViewHome();
        }

    }

    function logout() {
        $.ajax({
            url: baseUrl + "/user/" + appKay + '/_logout',
            method: 'POST',
            headers: {
                "Authorization": "Kinvey " + sessionStorage.getItem('authtoken'),
                "Content-Type": "application/json"
            },
            success: successLogout,
            error: handleError
        });

        function successLogout(data) {
            sessionStorage.clear();
            showNavigationLinks();
            showInfo('Logout successful.');
            showViewHome();
        }

    }

    function listMessages() {
        let content = $('#myMessages');
        content.empty();
        let username = sessionStorage.getItem('username');
        $.ajax({
            url: baseUrl + '/appdata/' + appKay + `/messages/?query={"recipient_username":"${username}"}`,
            headers: {
                "Authorization": "Kinvey " + sessionStorage.getItem('authtoken')
            },
            success: successGetMessages,
            error: handleError
        });

        function successGetMessages(data) {
            let table = $('<table>');
            table.append(`<thead>
                        <tr>
                            <th>From</th>
                            <th>Message</th>
                            <th>Date Received</th>
                        </tr>
                    </thead>`);
            let tbody = $('<tbody>');
            for (let user of data) {
                let tr = $('<tr>');
                tr.append($('<td>').text(formatSender(user.sender_name, user.sender_username)));
                tr.append($('<td>').text(user.text));
                tr.append($('<td>').text(formatDate(user._kmd.ect)));
                tbody.append(tr);
            }
            table.append(tbody);
            content.append(table);

        }
    }

    function listArchive() {
        let content = $('#sentMessages');
        content.empty();
        let username = sessionStorage.getItem('username');
        $.ajax({
            url: baseUrl + '/appdata/' + appKay + `/messages/?query={"sender_username":"${username}"}`,
            headers: {
                "Authorization": "Kinvey " + sessionStorage.getItem('authtoken')
            },
            success: successGetArchive,
            error: handleError
        });

        function successGetArchive(data) {
            let table = $('<table>');
            table.append(`<thead>
                         <tr>
                        <th>To</th>
                        <th>Message</th>
                        <th>Date Sent</th>
                        <th>Actions</th>
                    </tr>
                    </thead>`);
            let tbody = $('<tbody>');
            for (let user of data) {
                let tr = $('<tr>');
                tr.append($('<td>').text(user.recipient_username));
                tr.append($('<td>').text(user.text));
                tr.append($('<td>').text(formatDate(user._kmd.lmt)));
                tr.append($('<td>').append($('<button>').text("Delete").click(() => deleteMessage(user))));
                tbody.append(tr);
            }
            table.append(tbody);
            content.append(table);

        }
    }

    function sendMessage() {

        let name = sessionStorage.getItem('name');
        let username = sessionStorage.getItem('username');
        let recipient = $('#msgRecipientUsername').val();
        let text = $('#msgText').val();

        let data = JSON.stringify({
            'sender_username': username,
            'sender_name': name,
            'recipient_username': recipient,
            text
        });
        $.ajax({
            url: baseUrl + '/appdata/' + appKay + '/messages',
            method: "POST",
            headers: {
                "Authorization": "Kinvey " + sessionStorage.getItem('authtoken'),
                'Content-Type': 'application/json'
            },
            data,
            success: successSend,
            error: handleError
        });

        function successSend() {
            $('#msgText').val('');
            showViewArchiveSent();
            showInfo('Message sent.');
        }
    }

    function loadRecipient() {
        let content = $('#msgRecipientUsername');
        content.empty();
        $.ajax({
            url: baseUrl + '/user/' + appKay,
            headers: {
                "Authorization": "Kinvey " + sessionStorage.getItem('authtoken')
            },
            success: successLoad,
            error: handleError
        });

        function successLoad(data) {
            for (let user of data) {
                content.append($(`<option value="${user.username}">`)
                    .text(formatSender(user.name, user.username)))
            }
        }

    }

    function notification() {
        $(document).on({
            ajaxStart: function () {
                $("#loadingBox").show()
            },
            ajaxStop: function () {
                $("#loadingBox").fadeOut()
            }
        });
        $('#infoBox, #errorBox').click(function () {
            $(this).fadeOut();
        });
        $('#loadingBox, #infoBox, #errorBox').hide();
    }

    function deleteMessage(message) {
        $.ajax({
            url: baseUrl + '/appdata/' + appKay + '/messages/' + message._id,
            method: 'DELETE',
            headers: {
                "Authorization": "Kinvey " + sessionStorage.getItem('authtoken'),
            },
            success: successDelete,
            error: handleError
        });

        function successDelete() {
            showViewArchiveSent();
            showInfo('“Message deleted.');
        }
    }

    function formatDate(dateISO8601) {
        let date = new Date(dateISO8601);
        if (Number.isNaN(date.getDate()))
            return '';
        return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
            "." + date.getFullYear() + ' ' + date.getHours() + ':' +
            padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());
        function padZeros(num) {
            return ('0' + num).slice(-2);
        }
    }

    function formatSender(name, username) {
        if (!name)
            return username;
        else
            return username + ' (' + name + ')';
    }


    function saveSession(data) {
        sessionStorage.setItem('username', data.username);
        sessionStorage.setItem('name', data.name);
        sessionStorage.setItem('authtoken', data._kmd.authtoken);
        sessionStorage.setItem('id', data._id);
    }

    function handleError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON &&
            response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function () {
            $('#infoBox').fadeOut();
        }, 2500);
    }

    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }


}