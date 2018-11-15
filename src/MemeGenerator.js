/*
Lord Mendoza
SWE 432 - HW4

The following is in charge of the "Generate Memes" page. Very similar to HW3 version, except this
gives the option to Favorite a meme soon as it's regenerated. Also, when a meme is regenerated, it is
automatically added to the memes display in the home page (except the default one prior to pressing regenerate).
 */
import React, {Component} from 'react';
import './App.css';
import {Button, ControlLabel, FormControl, FormGroup, Glyphicon} from "react-bootstrap"
import LoadedImage from "./LoadedImage";

import MemeClient from "./MemeClient";
import firebase from "./firebase"

let client = new MemeClient();

export default class MemeGenerator extends Component {
    constructor(props) {
        super(props);
        this.state = {selectedTemplate: undefined, availableTemplates: undefined};
        this.handleChangeSelectedTemplate = this.handleChangeSelectedTemplate.bind(this);

    }

    componentDidMount(){
        client.getTemplate().then(templates => {
            this.setState({
                availableTemplates: templates,
                selectedTemplate: Object.keys(templates)[0]
            });
        })
    }
    handleChangeSelectedTemplate(v) {
        this.setState({selectedTemplate: v.target.value});
    }

    render() {
        if (!this.state.availableTemplates)
            return <div>Loading list of available templates.</div>
        return (
            <div>
                <h2>Make a meme!</h2>
                <div>
                    Choose a template:
                    <FormControl componentClass={"select"} value={this.state.selectedTemplate} onChange={this.handleChangeSelectedTemplate}>
                        {
                            Object.keys(this.state.availableTemplates).map(v => {
                                return <option value={v} key={v}>{v}</option>
                            })}
                    </FormControl>
                    <MemeCustomizer templateName={this.state.selectedTemplate}
                                    template={this.state.availableTemplates[this.state.selectedTemplate]}/>
                </div>
            </div>
        )
    }
}

class MemeCustomizer extends Component
{
    constructor(props)
    {
        super(props);

        this.req = null;
        let tmpText = {};
        for (let textblock of Object.keys(this.props.template.text))
        {
            tmpText[textblock] = textblock;
        }

        /*
        Added two new states:
        -initialRun: tracks if the image generated is the "default" or initial one
        -disableButton: uses initialRun to enable/disable "Save meme" option
        -memeSaved: check if the user toggled for the meme to be saved
         */
        this.state = {img: undefined, text: tmpText, updateInProgress: false, disableButton: true, initialRun: true, memeSaved: false, timeStamp: undefined};
        this.handleChangeInTextField = this.handleChangeInTextField.bind(this);
        this.handleMemeTextChange = this.handleMemeTextChange.bind(this);
        this.saveMeme = this.saveMeme.bind(this);
    }

    componentDidMount()
    {
        this.handleMemeTextChange();
    }

    componentDidUpdate(prevProps)
    {
        if (this.props.template != prevProps.template && this.props.templateName)
        {
            let tmpText = {};
            for (let textblock of Object.keys(this.props.template.text))
            {
                tmpText[textblock] = textblock;
            }
            console.log(tmpText);

            //Initializes the state again
            this.setState({img: undefined, text: tmpText, initialRun: true});
            this.setState({updateInProgress: true});
            this.req =
                client.generateMeme(
                    this.props.templateName,
                    tmpText
                );
            this.req.then(img => {
                /*
                Added code: Checks if its the first run (as to avoid the default from getting the option to be saved)
                 */
                if (this.state.initialRun)
                    this.setState({img: img, updateInProgress: false, initialRun: false, disableButton: true, memeSaved: false});
                else
                    this.setState({img: img, updateInProgress: false, disableButton: false});
            }).catch(e => console.log(e));
        }
    }

    handleMemeTextChange(ev)
    {
        if (ev)
            ev.preventDefault();
        this.setState({updateInProgress: true});
        this.req =
            client.generateMeme(
                this.props.templateName,
                this.state.text
            );
        this.req.then(img => {
            /*
            Added code: Checks if its the first run (as to avoid the default from getting the option to be saved), & further
            checks if the meme is saved before (as to allow it to be saved again should the user choose to regenerate
            the same template & text, per specs).
             */
            if (this.state.initialRun)
                this.setState({img: img, updateInProgress: false, initialRun: false});
            else
            {
                var timestamp = new Date().toString();
                firebase.firestore.collection("spicyGeneratedMemes").doc(timestamp).set({
                    templateName: this.props.templateName,
                    templateText: this.state.text,
                    creationDate: timestamp
                });

                if (this.state.memeSaved)
                    this.setState({img: img, updateInProgress: false, disableButton: false, memeSaved: false, timeStamp: timestamp});
                else
                    this.setState({img: img, updateInProgress: false, disableButton: false, timeStamp: timestamp});
            }
        }).catch(e => console.log(e));
    }

    handleChangeInTextField(v)
    {
        let block = v.target.attributes["data-textblock"].value;
        let newText = this.state.text;
        newText[block] = v.target.value;
        this.setState(
            {text: newText}
        )
    }

    /*
    Added code: Calls to firebase to store the template name & given text, as well as the
    creation date for later sorting; differs from save via "regenerate" in that it uses the user's email as key.
     */
    saveMeme(e)
    {
        var docRef = firebase.firestore.collection(firebase.auth.currentUser.email).doc(this.state.timeStamp).set({
            templateName: this.props.templateName,
            templateText: this.state.text,
            creationDate: this.state.timeStamp,
            timeFavorited: this.state.timeStamp
        });
        this.setState({memeSaved: true, disableButton: true});
    }

    /*
    Added Code:

    Added button: allows the user to save the meme generated to the database, with their email as key
    Added conditional return: checks if the user saved the meme or not. If saved, the button changes to a
    success & is disabled, else primary & enabled.
    Added functionality: as a meme is "regenerated" it is automatically added to the general pool of memes generated by all users
     */
    render()
    {
        if (!this.props.template.text)
            return <p>Loading, there's no text on this?</p>;

        //Shows version with save meme button on default
        if (!this.state.memeSaved)
        {
            return (
                <div>

                    Customize the text:
                    <form onSubmit={this.handleMemeTextChange}>
                        <FormGroup>
                            {Object.keys(this.props.template.text).map(t => {
                                let txt = this.state.text[t];
                                if (!txt)
                                    txt = t;
                                return <span key={t}><ControlLabel>{t}</ControlLabel> <FormControl type="text"
                                                                                                   value={txt}
                                                                                                   disabled={this.state.updateInProgress}
                                                                                                   onChange={this.handleChangeInTextField}
                                                                                                   data-textblock={t}/></span>
                            })}
                            <Button type={"submit"} disabled={this.state.updateInProgress}>Regenerate</Button>
                        </FormGroup>
                    </form>

                    <div className="alignDiv">
                        <LoadedImage src={this.state.img}/>

                        <div className="text-right">
                            <Button bsStyle="primary"
                                    disabled={this.state.disableButton}
                                    onClick={this.saveMeme}> Save Meme </Button>
                        </div>
                    </div>
                </div>
            )
        }
        //Shows version with save meme button on success
        else
        {
            //If the image changed, don't show the "saved" button as its updating. Else show the saved button.
            var savedButton = <div> </div>;
            if (this.state.img)
                savedButton = <div className="text-right">
                    <Button bsStyle="success"
                            disabled={this.state.disableButton}
                            onClick={this.saveMeme}> Save Meme <b>✔</b> </Button>
                </div>;
            return (
                <div>

                    Customize the text:
                    <form onSubmit={this.handleMemeTextChange}>
                        <FormGroup>
                            {Object.keys(this.props.template.text).map(t => {
                                let txt = this.state.text[t];
                                if (!txt)
                                    txt = t;
                                return <span key={t}><ControlLabel>{t}</ControlLabel> <FormControl type="text"
                                                                                                   value={txt}
                                                                                                   disabled={this.state.updateInProgress}
                                                                                                   onChange={this.handleChangeInTextField}
                                                                                                   data-textblock={t}/></span>
                            })}
                            <Button type={"submit"} disabled={this.state.updateInProgress}>Regenerate</Button>
                        </FormGroup>
                    </form>

                    <div className="alignDiv">
                        <LoadedImage src={this.state.img}/>

                        {savedButton}
                    </div>
                </div>
            )
        }
    }
}



