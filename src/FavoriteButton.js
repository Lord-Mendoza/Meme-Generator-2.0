/*
Lord Mendoza
SWE 432 - HW4

The following component has been created to facilitate the "Favorite" button, and is in charge of
adding/removing it from the database
 */
import {Component} from "react";
import React from "react";
import firebase from "./firebase";
import {Button} from "react-bootstrap";

export default class FavoriteButton extends Component
{
    constructor(props)
    {
        super(props);

        this.state = {memeFavorited: false};                //Tracks if the user favorited the given template
        this.favoriteMeme = this.favoriteMeme.bind(this);
        this.unfavoriteMeme = this.unfavoriteMeme.bind(this);
    }

    /*
    Initial call to firebase to consult the user's database to see if the meme is favorited or not (by checking if
    it exists). If it's favorited, the favorite state is toggled; otherwise, not.
     */
    componentWillMount()
    {
        firebase.firestore.collection(firebase.auth.currentUser.email).doc(this.props.src.template.creationDate)
            .get().then(v => {
            if (v.exists)
            {
                this.setState({memeFavorited: true});
            }
            else
            {
                this.setState({memeFavorited: false});
            }
        });
    }

    /*
    Handles changes to firebase and state if the user opted to favorite meme.
     */
    favoriteMeme(e)
    {
        var temp = this.props.src.template;
        temp["timeFavorited"] = new Date().toString();
        var docRef = firebase.firestore.collection(firebase.auth.currentUser.email)
            .doc(this.props.src.template.creationDate).set(temp)
            .then(v => {
                this.setState({memeFavorited: true});
            });
    }

    /*
    Handles changes to firebase and state if the user opted to unfavorite meme.
     */
    unfavoriteMeme(e)
    {
        var docRef = firebase.firestore.collection(firebase.auth.currentUser.email)
            .doc(this.props.src.template.creationDate).delete()
            .then(v => {
                this.setState({memeFavorited: false});
            });
    }

    /*
    In charge of displaying the appropriate button configuration
     */
    render()
    {
        if (this.state.memeFavorited)
        {
            return <div><Button bsStyle="danger"
                                onClick={this.unfavoriteMeme}> Remove Favorite </Button></div>;
        }
        else
        {
            return <div><Button bsStyle="primary"
                                onClick={this.favoriteMeme}> Add Favorite </Button></div>
        }
    }
}