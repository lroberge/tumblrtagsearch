let apikey = "YOUR-API-KEY-HERE" // put your API key in here when hosting yourself

let eastereggs = {
  default: function() {
    document.body.style.backgroundColor = "";
  },
  ralsei: function() {
    document.body.style.backgroundColor = "#90ee90";
  },
  "destiny 2": function() {
    document.body.style.backgroundColor = "#21242b";
  }
};

let tagbox = document.querySelector("#tagbox");
let postgrid = document.querySelector("#postgrid");
let loaderbutton = document.querySelector("#loaderbutton");
let pagetimestamp;

let searchTimeout;

tagbox.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    //console.log("enter pressed...");
    checkToUpdate();
    clearTimeout(searchTimeout);
  } else {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(checkToUpdate, 1000);
  }
});

loaderbutton.addEventListener("click", loadMorePosts);

// check if we should update the posts
// outdated name, runs rarely (one second after last keypress in tagbox or upon enter press)
function checkToUpdate() {
  easterEggCheck();
  //console.log("updating posts...");
  if (tagbox.value != "") {
    loadPosts();
    postgrid.innerHTML = '<div id="encouragement">Grabbing posts...</div>';
  } else {
    loaderbutton.style.display = "none";
    postgrid.innerHTML = '<div id="encouragement">Go on, get searching!</div>';
  }
}

function easterEggCheck() {
  if (tagbox.value in eastereggs && tagbox.value != "default") {
    eastereggs[tagbox.value]();
  }
  else {
    eastereggs["default"]();
  }
}

// set up an xhr to grab posts for the given tag
function loadPosts() {
  let queryurl =
    "https://api.tumblr.com/v2/tagged?api_key=" + apikey + "&tag=";
  queryurl += encodeURI(tagbox.value);
  let postsxhr = new XMLHttpRequest();
  postsxhr.onload = loadedPosts;
  postsxhr.onerror = erroredPosts;
  postsxhr.open("GET", queryurl);
  postsxhr.send();
}

// set up an xhr to grab older posts for the given tag
// yeah this violates DRY
// it's the one time I did it (i think)
// and i didn't want to spend 20 precious minutes figuring out how to cleverly refactor it
// sorry
function loadMorePosts() {
  //clear animations completely on any already-loaded post
  document.querySelectorAll(".post").forEach(function(post) {
    post.style["animation-duration"] = "0s";
    post.style["animation-delay"] = "0s";
    //console.log("de-animated a post");
  });
  let queryurl =
    "https://api.tumblr.com/v2/tagged?api_key="+ apikey + "&tag=";
  queryurl += encodeURI(tagbox.value);
  queryurl += "&before=" + pagetimestamp;
  //console.log(queryurl);
  let postsxhr = new XMLHttpRequest();
  postsxhr.onload = loadedPosts;
  postsxhr.onerror = erroredPosts;
  postsxhr.open("GET", queryurl);
  postsxhr.send();
}

// when we got the response, loop through the posts and add them to the grid
function loadedPosts(e) {
  //don't clear if the url's got a timestamp marker in it, indicating "load more posts"
  if (e.target.responseURL.search("&before=") < 0) postgrid.innerHTML = "";
  //console.log(e.target.response);
  let json = JSON.parse(e.target.response);
  let postdelay = 0;
  for (const post of json.response) {
    switch (post.type) {
      case "photo":
        //console.log("creating photo post");
        createPhotoPost(post, postdelay);
        break;
      case "text":
        //console.log("creating text post");
        createTextPost(post, postdelay);
        break;
      default:
        //console.log(String.toString(post));
        break;
    }
    postdelay += 0.1;
    pagetimestamp = post.timestamp;
  }
  removeErrors();
  loaderbutton.style.display = "block";
}

//clear insecurely embedded images (loaded through http)
function removeErrors() {
  document.querySelectorAll("img").forEach(function(img) {
    img.onerror = function() {
      this.style.display = "none";
    };
    //console.log("Did img " + img.src);
  });
}

// this should literally never happen
function erroredPosts(e) {
  alert("Posts were unable to be loaded");
}

// slam a known "photo" type post into the post grid element
// formats it and all
function createPhotoPost(post, delay) {
  let photourl = post.photos[0].original_size.url;
  let caption = post.caption;
  let blogpfp =
    "https://api.tumblr.com/v2/blog/" + post.blog.uuid + "/avatar/128";
  let blogname = post.blog_name;
  let blogurl = post.blog.url;
  let postlink = post.post_url;
  let poststring =
    '<div class="post" style="animation-delay:' +
    delay +
    's"><div class="imagepostimg" style="background-image:url(' +
    photourl +
    ');"><div class="imagepostblogbox"><img class="postblogimg" src="' +
    blogpfp +
    '"><a class="imagepostblogname" href="' +
    blogurl +
    '">' +
    blogname +
    '</a></div></div><div class="imagepostbody">' +
    caption +
    '</div><div class="postcroplink"><a href="' +
    postlink +
    '" target="_blank">Read full post</a></div></div>';
  postgrid.innerHTML += poststring;
}

// slam a known "text" (read: arbitrary HTML) type post into the post grid element
// attempts to format it and all
function createTextPost(post, delay) {
  let name = post.blog_name;
  let body = post.body;
  let blogpfp =
    "https://api.tumblr.com/v2/blog/" + post.blog.uuid + "/avatar/128";
  let blogname = post.blog_name;
  let blogurl = post.blog.url;
  let postlink = post.post_url;
  let poststring =
    '<div class="post" style="animation-delay:' +
    delay +
    's"><img class="postblogimg" src="' +
    blogpfp +
    '"><a class="textpostname" href="' +
    blogurl +
    '">' +
    blogname +
    '</a><div class="textpostbody">' +
    body +
    '</div><div class="postcroplink"><a href="' +
    postlink +
    '" target="_blank">Read full post</a></div></div>';
  postgrid.innerHTML += poststring;
}
