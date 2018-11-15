/*
Lord Mendoza
SWE 432 - HW4

The following is in charge of displaying the memes, whether it be the homepage or the "view favorite memes" page
 */

import React, {Component} from "react";
import {Button, Panel} from "react-bootstrap";
import firebase from "./firebase"
import Pagination from "react-js-pagination";
import LoadedImage from "./LoadedImage";
import MemeClient from "./MemeClient";
import FavoriteButton from "./FavoriteButton";
import {Redirect} from "react-router-dom";

let client = new MemeClient();

export default class MemeList extends Component
{
    constructor(props)
    {
        super(props);

        /*
        State properties & purpose are trivial
         */
        this.state = {listOfMemes: {}, listOfImages: [], imagesToDisplay: [], observerMethod: undefined, activePage: 1};
        this.pageChangeHandler = this.pageChangeHandler.bind(this);
        this.sortImages = this.sortImages.bind(this);
        this.splitImageArray = this.splitImageArray.bind(this);
    }

    /*
    Will check if the user is pointed at homepage or view saved memes. If homepage, display all generated memes
     from all users. If view saved memes, only show the user's favorited memes.
     */
    componentDidMount()
    {
        if (this.props.isUnfiltered)
        {
            var cancelSnapshot1 = firebase.firestore.collection("spicyGeneratedMemes").orderBy("creationDate", "desc").onSnapshot(snapshot => {
                var memesFromDatabase = [];
                snapshot.forEach(meme => {
                    memesFromDatabase.push(meme.data());
                });

                Object.values(memesFromDatabase).map(meme => {
                    client.generateMeme(meme.templateName, meme.templateText).then(async image => {
                        var newState = {date: meme.creationDate, img: image, template: meme};

                        await this.setState((prevState) => ({
                            listOfMemes: memesFromDatabase,
                            listOfImages: prevState.listOfImages.concat(newState),
                            observerMethod: cancelSnapshot1
                        }));
                    }).then(v => this.sortImages()) //Every time a new image is inserted to the state, re-sort the images
                        .then(v => this.splitImageArray()); //Split the array into 10s
                });
            });
        }
        else
        {
            var cancelSnapshot2 = firebase.firestore.collection(firebase.auth.currentUser.email).orderBy("creationDate", "desc").onSnapshot(snapshot => {
                var memesFromDatabase = [];
                snapshot.forEach(meme => {
                    memesFromDatabase.push(meme.data());
                });

                Object.values(memesFromDatabase).map(meme => {
                    client.generateMeme(meme.templateName, meme.templateText).then(async image => {
                        var newState = {date: meme.timeFavorited, img: image, template: meme};

                        await this.setState((prevState) => ({
                            listOfMemes: memesFromDatabase,
                            listOfImages: prevState.listOfImages.concat(newState),
                            observerMethod: cancelSnapshot2
                        }));
                    }).then(v => this.sortImages()) //Every time a new image is inserted to the state, re-sort the images
                        .then(v => this.splitImageArray()); //Split the array into 10s
                });
            });
        }
    }


    /*
    Sorts the images by accessing the date property of the image in the state, then puts them in most recent-oldest
     */
    sortImages()
    {
        var temp = this.state.listOfImages;
        temp.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });
        this.setState({listOfImages: temp});
    }

    /*
    Divides up the listOfImages into groups of 10s, and stores each group into imagesToDisplay
    so that Pagination shows 10 images at a time

    Most of the code is borrowed from:
    https://ourcodeworld.com/articles/read/278/how-to-split-an-array-into-chunks-of-the-same-size-easily-in-javascript
    (OK'ed by Professor Bell)
     */
    splitImageArray()
    {
        var index = 0;
        var myArray = this.state.listOfImages;
        var arrayLength = this.state.listOfImages.length;
        var chunk_size = 10;
        var tempArray = [];

        for (index = 0; index < arrayLength; index += chunk_size) {
            var myChunk = myArray.slice(index, index+chunk_size);
            tempArray.push(myChunk);
        }

        this.setState({imagesToDisplay: tempArray});
    }

    /*
    When the component unmounts, the observer method is called to avoid leakage.
     */
    componentWillUnmount()
    {
        if (this.state.observerMethod !== undefined)
            this.state.observerMethod();
    }

    /*
    Handles page changes
     */
    pageChangeHandler(pageNumber)
    {
        this.setState({activePage: pageNumber});
    }

    /*
    If there are no images to show, don't show anything. Otherwise, show the images & buttons.
     */
    render()
    {
        if (this.state.listOfImages.length === 0 || this.state.imagesToDisplay.length === 0 || firebase.auth.currentUser === null)
        {
            return (
                <div>
                    <Pagination>
                    </Pagination>

                    <Pagination>
                    </Pagination>
                </div>
            )
        }
        else {
            return (
                <div>
                    <Pagination
                        activePage = {this.state.activePage}
                        itemsCountPerPage={10}
                        totalItemsCount={Object.keys(this.state.listOfMemes).length}
                        pageRangeDisplayed={5}
                        onChange = {this.pageChangeHandler}>
                    </Pagination>

                    <div>
                        {
                            Object.values(this.state.imagesToDisplay[this.state.activePage - 1]).map(v => {
                                return <div className="alignDiv">
                                    <LoadedImage src={v.img}/>
                                    <div className="text-right">
                                        <FavoriteButton src = {v}/>
                                    </div>
                                </div>
                            })
                        }
                    </div>

                    <Pagination
                        activePage = {this.state.activePage}
                        itemsCountPerPage={10}
                        totalItemsCount={Object.keys(this.state.listOfMemes).length}
                        pageRangeDisplayed={5}
                        onChange = {this.pageChangeHandler}>
                    </Pagination>
                </div>
            )
        }
    }
}