/////////////////////////////////////////
// post
/////////////////////////////////////////
// author.avatar       : "https://cdn.bsky.app/img/avatar/plain/did:plc:vqyhh3ajdlni3fl25lfbp7sn/bafkreia6xdt4c6gv3fyoxnftvjcxz5jcyen7rchse5
// jkehrcifgrdpgbbm@jpeg"
// author.displayName       : "Arbrav"
// author.handle            : "arbrav.bsky.social",

// embed.$type              : "app.bsky.embed.images#view"
// embed.images[0].alt      : "Petit grenadier en fleur sur fonds de terres cuites, de ciel bleu avec un nuage blanc",
// embed.images[0].fullsize : "https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:vqyhh3ajdlni3fl25lfbp7sn/bafkreigb5bhfekvjfbicriwljvtfc\r\nw4ozfe447solasynlelb5qitnm4de@jpeg"

// indexedAt                : "2024-05-18T12:17:34.561Z"
// likeCount                : 1
// replyCount               : 0
// repostCount              : 0
// uri                      : "at://did:plc:vqyhh3ajdlni3fl25lfbp7sn/app.bsky.feed.post/3ksr7u22p6b2m",
//// public bsky.app link   : https://bsky.app/profile/arbrav.bsky.social/post/3ksr7u22p6b2m
// record.$type             : "app.bsky.feed.post",
// record.createdAt         : "2024-05-18T12:17:34.561Z",
//// record.embed.images...  skipped
// record.langs             : ["fr"],
// record.text              : "De la couleur"

import {BES_DATE_FORMAT, isSet} from "../lib/Common.js";
import dayjs from "dayjs";
import console from "node:console";

const bskyAppPostUriBuilder = (authorHandle, postId) => `https://bsky.app/profile/${authorHandle}/post/${postId}`;
const bskyAppHAndleUriBuilder = authorHandle => `https://bsky.app/profile/${authorHandle}`;

export const fromBlueskyPostImage = img => {
    const {alt, fullsize} = img;
    return {alt, fullsize};
}
export const fromBlueskyPostImages = images => images?.map(fromBlueskyPostImage)
/**
 * mapper for post entry
 */
export const fromBlueskyPost = post => {
    const {
        "author": {did, avatar, displayName, handle, "viewer": {muted}},
        embed,
        indexedAt, likeCount, replyCount, repostCount, uri, cid,
        record, viewer
    } = post;
    const result = {
        "author": {did, avatar, displayName, handle, "viewer": {muted}},
        indexedAt, likeCount, replyCount, repostCount, uri, cid,
        "record": {
            "$type": record["$type"],
            "createdAt": record.createdAt,
            "langs": record.langs,
            "text": record.text,
            "reply": record.reply
        },
        viewer
    };
    if (isSet(embed)) {
        result["embed"] = {
            "$type": embed["$type"],
            "images": fromBlueskyPostImages(embed.images)
        };
    }
    return result;
}
/**
 * mapper for posts list
 */
export const fromBlueskyPosts = posts => posts?.map(fromBlueskyPost)

export const firstImageOf = post => !isSet(post?.embed?.images) ? null : post?.embed?.images[0];
export const postLinkOf = post => {
    const {uri, author: {handle}} = post;
    const id = uri.split("/app.bsky.feed.post/")[1];
    return isSet(id) && isSet(handle) ? bskyAppPostUriBuilder(handle, id) : null;
}

export const toLocaleDate = blueskyDate => {
    try {
        return dayjs(blueskyDate).format(BES_DATE_FORMAT);
    } catch (err) {
        console.log(err);// should not happen
        return blueskyDate;
    }
}

export const postInfoOf = post => {
    const {author: {handle, displayName}, record: {text, createdAt}} = post;
    const recordCreatedAt = createdAt ? toLocaleDate(createdAt) : "";
    if (!handle || !text || !recordCreatedAt) {
        return "";
    }
    return `${recordCreatedAt} --- ${displayName} (@${handle}): ${text}`;
}
export const postImageOf = postImage => {
    const {fullsize, alt} = postImage;
    if (!fullsize) {
        return "";
    }
    return alt ? `${fullsize} --- ${alt}` : fullsize;
}

export const postHtmlOf = post => postFormatterOf(post, "html");
export const postTextOf = post => postFormatterOf(post, "text");

export const htmlLink = (label, href) => `<a href="${href}">${label}</a>`;
export const postFormatterOf = (post, format = "text") => {
    const {author: {handle, displayName}, record: {text, createdAt}} = post;
    if (!post || !handle || !createdAt) {
        return "";
    }
    const textToShow = isSet(text) ? text : "(no text)"
    const username = isSet(displayName) ? displayName : handle;
    const postDate = createdAt ? toLocaleDate(createdAt) : "";
    const postLink = postLinkOf(post);
    const handleLink = bskyAppHAndleUriBuilder(handle);
    if (format === "text") {
        return `${postLink} ${postDate} by @${username} (${handleLink}) --- ${textToShow}`;
    } else if (format === "html") {
        return `${htmlLink(postDate, postLink)} --- ${htmlLink(username, handleLink)}: ${textToShow}`;
    } else {
        throw new Error(`unsupported format ${format}`);
    }
}

export const postAuthorOf = post => post?.author;
export const postBodyOf = post => post?.record?.text;
export const displayNameOfPostAuthor = postAuthor => postAuthor?.displayName;
export const handleOfPostAuthor = postAuthor => postAuthor?.handle;
export const didOfPostAuthor = postAuthor => postAuthor?.did;

export const descriptionOfPostAuthor = postAuthor => {
    const displayName = displayNameOfPostAuthor(postAuthor);
    const handle = handleOfPostAuthor(postAuthor);
    return handle === displayName ? `@${handle}` : `${displayName}(@${handle})`;
}

export const filterWithEmbedImageView = p => p?.embed?.$type === "app.bsky.embed.images#view"
export const filterWithNoReply = p => p?.replyCount === 0
export const filterWithNotMuted = p => p?.author?.viewer?.muted === false
export const filterWithNoReplyDisabled = p => p?.viewer?.replyDisabled !== true

export const postsFilterSearchResults = (responsePosts, hasImages, hasNoReply, isNotMuted, exclusions = []) => {
    let posts = fromBlueskyPosts(responsePosts);
    posts = hasImages ? posts?.filter(filterWithEmbedImageView) : posts;
    posts = hasNoReply ? posts?.filter(filterWithNoReply) : posts;
    posts = isNotMuted ? posts?.filter(filterWithNotMuted) : posts;
    // remove excluded author handle
    posts = exclusions.length > 0 ? posts?.filter(p => !exclusions.includes(p?.author?.handle)) : posts;
    // undertakes public viewer replyDisabled rule // https://github.com/bluesky-social/atproto/discussions/2576
    posts = posts?.filter(filterWithNoReplyDisabled);
    return posts;
}

export const txtOfPosts = (posts, max = 5) => posts.slice(0,max).map(postTextOf).join("\n\n")
export const htmlOfPosts = (posts, max = 5) => posts.slice(0,max).map(postHtmlOf).join("<br/><br/>")