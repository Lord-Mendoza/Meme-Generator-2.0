/*
Lord Mendoza
SWE 432 - HW4

The following is in charge of handling the "login/register" tab of the MemeBase
 */
import React, {Component} from "react";
import {Alert, Button, ControlLabel, FormControl} from "react-bootstrap";
import firebase from "./firebase"
import {Redirect} from "react-router-dom";

export default class Login extends Component
{
    constructor(props) {
        super(props);

        this.state = {email: "", password: "", disableComponent: false, errorMessage: "", redirectUser: false};
        this.handleInputEmail = this.handleInputEmail.bind(this);
        this.handleInputPassword = this.handleInputPassword.bind(this);
        this.submitInfo = this.submitInfo.bind(this);
    }

    /*
    Changes the email state
     */
    handleInputEmail(e)
    {
        this.setState({email: e.target.value});
    }

    /*
    Changes the password state
     */
    handleInputPassword(e)
    {
        this.setState({password: e.target.value});
    }

    /*
    Analyzes the user input for email and password, and tries to sign in the user. If it fails because the
    account does not exist, an account is automatically created on their behalf. Any other sign-in/account creation
    errors are accounted for.
     */
    submitInfo(e)
    {
        e.preventDefault();

        firebase.auth.signInWithEmailAndPassword(this.state.email, this.state.password).then(temp =>{
            //When successful, don't show the alert component
            this.setState({disableComponent: false, redirectUser: true});
        })
        .catch(signInError => {
            //Otherwise, store the sign in error code to this variable, which will be deciphered in a moment
           let signInErrorCode = signInError.code;

           //If email is invalid, show the alert & pass the following message
           if (signInErrorCode === 'auth/invalid-email')
           {
               this.setState({disableComponent: true, errorMessage: "Error: The email address is badly formatted."});
           }
           //Else if user is not found...
           else if (signInErrorCode === 'auth/user-not-found')
           {
               //...invoke a call to create the user automatically
                firebase.auth.createUserWithEmailAndPassword(this.state.email, this.state.password)
                    .then(tempTwo => {
                        //If created successfully, redirect the user
                        this.setState({disableComponent: false, redirectUser: true});
                    })
                    //Else catch the error when creating the account
                    .catch(createError => {
                        let createErrorCode = createError.code;

                        //If call to create user returns weak password, instruct the user to try again
                        if (createErrorCode === 'auth/weak-password')
                            this.setState({disableComponent: true, errorMessage: "Error: Password should be at least 6 characters"});
                    });
           }
           //Lastly, if the account exists and the password is simply wrong, prompt user to try again
           else if (signInErrorCode === "auth/wrong-password")
               this.setState({disableComponent: true, errorMessage: "Error: The password is invalid or the user does not have a password."});
        });
    }

    render() {
        //If the component "Alert" is enabled, display this format (which shows the error message)
        if (this.state.disableComponent)
        {
            return (
                <div>
                    <form onSubmit={this.submitInfo.bind(this)}>
                        <ControlLabel> <b> Email address: </b></ControlLabel>
                        <FormControl type="email"
                                     value={this.state.email}
                                     onChange={this.handleInputEmail.bind(this)}>
                        </FormControl>

                        <ControlLabel> <b> Password: </b></ControlLabel>
                        <FormControl type="password"
                                     value={this.state.password}
                                     onChange={this.handleInputPassword.bind(this)}>
                        </FormControl>

                        <Alert bsStyle="danger"> {this.state.errorMessage} </Alert>

                        <div>
                            <Button type="submit">
                                Log in (or register)
                            </Button>
                        </div>
                    </form>
                </div>
            )
        }
        //Else if the component is disabled, but redirecting the user isn't toggled yet, show this normal version.
        else if (!this.state.disableComponent && !this.state.redirectUser)
        {
            return (
                <div>
                    <form onSubmit={this.submitInfo.bind(this)}>
                        <ControlLabel> <b> Email address: </b></ControlLabel>
                        <FormControl type="email"
                                     value={this.state.email}
                                     onChange={this.handleInputEmail.bind(this)}>
                        </FormControl>

                        <ControlLabel> <b> Password: </b></ControlLabel>
                        <FormControl type="password"
                                     value={this.state.password}
                                     onChange={this.handleInputPassword.bind(this)}>
                        </FormControl>

                        <div>
                            <Button type="submit">
                                Log in (or register)
                            </Button>
                        </div>
                    </form>
                </div>
            )
        }
        //Otherwise, redirect the user.
        else
        {
            return <Redirect to = {"/"}/>
        }
    }
}