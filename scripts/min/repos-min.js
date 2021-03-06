/**
 * Used from https://h5bp.github.io/assets/app.js
 *
 * @param  {[type]} $         [description]
 * @param  {[type]} undefined [description]
 * @return {[type]}           [description]
 */
(function ($, undefined) {

    var orgName = 'am-impact',
        filterJson = [];

    // Return the repo url
    function getRepoUrl(repo) {
        return repo.homepage || repo.html_url;
    }

    // Return the repo description
    function getRepoDesc(repo) {
        return repo.description;
    }

    // Display a repo's overview (for recent updates section)
    function showRepoOverview(repo) {
        var item;
        item = '<li>';
        item +=     '<span class="name"><a href="' + repo.html_url + '">' + repo.name + '</a></span>';
        item +=     ' &middot; <span class="time"><a href="' + repo.html_url + '/commits">' + prettyDate(repo.pushed_at) + '</a></span>';
        item += '</li>';

        $(item).appendTo("#updated-repos");
    }

    // Create an entry for the repo in the grid of org repos
    function showRepo(repo) {
        var $item = $('<li data-index="' + repo.name + '" />');
        var $link = $('<a class="panel repo" href="' + getRepoUrl(repo) + '" />');
        var $facepile = $('<div class="repo__team" />');

        $link.append('<h2 class="repo__name">' + repo.name + '</h2>');
        $link.append('<p class="repo__info">' + repo.watchers + ' stargazers ' + (repo.language !== null ? '&middot; ' + repo.language : '') + '</p>');
        $link.append('<p class="repo__desc">' + getRepoDesc(repo) + '</p>');

        $.getJSON('https://api.github.com/repos/' + orgName + '/' + repo.name + '/collaborators?callback=?&client_id=053d41596f4742e89b66&client_secret=cf30ff2da4e1ef6248594d392288b01d7fd1d0da', function (result) {
            var collaborators = result.data;
            $.each(collaborators, function (i, collaborator) {
                 $facepile.append($('<img src="' + collaborator.avatar_url + '" title="' + collaborator.login + '" alt="' + collaborator.login + '">'));
            });
        });

        $facepile.appendTo($link);
        $link.appendTo($item);
        $item.appendTo('#repos');
    }

    $.getJSON('https://api.github.com/orgs/' + orgName + '/repos?callback=?&client_id=053d41596f4742e89b66&client_secret=cf30ff2da4e1ef6248594d392288b01d7fd1d0da', function (result) {
        var repos = result.data;

        $(function () {
            $('#num-repos').text(repos.length);

            // Convert pushed_at to Date.
            $.each(repos, function (i, repo) {
                repo.pushed_at = new Date(repo.pushed_at);

                filterJson.push( {
                    name: "" + repo.name + "",
                    description: "" + getRepoDesc(repo) + ""
                } );

                var weekHalfLife  = 1.146 * Math.pow(10, -9);

                var pushDelta    = (new Date()) - Date.parse(repo.pushed_at);
                var createdDelta = (new Date()) - Date.parse(repo.created_at);

                var weightForPush = 1;
                var weightForWatchers = 1.314 * Math.pow(10, 7);

                repo.hotness = weightForPush * Math.pow(Math.E, -1 * weekHalfLife * pushDelta);
                repo.hotness += weightForWatchers * repo.watchers / createdDelta;
            });

            // Sort by hotness.
            repos.sort(function (a, b) {
                if (a.hotness < b.hotness) return 1;
                if (b.hotness < a.hotness) return -1;
                return 0;
            });

            $.each(repos, function (i, repo) {
                showRepo(repo);
            });

            // Sort by most-recently pushed to.
            repos.sort(function (a, b) {
                if (a.pushed_at < b.pushed_at) return 1;
                if (b.pushed_at < a.pushed_at) return -1;
                return 0;
            });

            $.each(repos.slice(0, 3), function (i, repo) {
                showRepoOverview(repo);
            });

            // Filter
            var fuzzyOptions = {
                    pre: ''
                    , post: ''
                    , extract: function(el) { return el.name; }
                },
                $repositems = $('#repos > li');

            $('.searchField').focus().on('keyup', function() {
                var results = fuzzy.filter($(this).val(), filterJson, fuzzyOptions);
                var matches = results.map(function(el) { return el.string; });

                $repositems.hide();

                $.each(matches, function(i, el) {
                    $repositems.filter('[data-index="' + el + '"]').show();
                });
            });
        });
    });

    $.getJSON('https://api.github.com/orgs/' + orgName + '/members?callback=?&client_id=053d41596f4742e89b66&client_secret=cf30ff2da4e1ef6248594d392288b01d7fd1d0da', function (result) {
        var members = result.data;
        $(function () {
            $('#num-members').text(members.length);
        });
    });

    // Relative times
    function prettyDate(rawdate) {
        var date, seconds, formats, i = 0, f;
        date = new Date(rawdate);
        seconds = (new Date() - date) / 1000;
        formats = [
            [60, 'seconds', 1],
            [120, '1 minute ago'],
            [3600, 'minutes', 60],
            [7200, '1 hour ago'],
            [86400, 'hours', 3600],
            [172800, 'Yesterday'],
            [604800, 'days', 86400],
            [1209600, '1 week ago'],
            [2678400, 'weeks', 604800]
        ];

        while (f = formats[i ++]) {
            if (seconds < f[0]) {
                return f[2] ? Math.floor(seconds / f[2]) + ' ' + f[1] + ' ago' :  f[1];
            }
        }
        return 'A while ago';
    }

})(jQuery);