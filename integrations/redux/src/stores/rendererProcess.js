/**
 *
 */
import {createStore, applyMiddleware, compose} from 'redux';
import {downstreamReducer} from '../reducers';
import {downstreamMiddleware} from '../middleware/downstream';
import {forwardToMain, replayActionRenderer, getInitialStateRenderer} from 'electron-redux';
import {downstreamGetListWithInfo, downstreamCreate, downstreamGetOfflineLink} from '../actions/downstream';
import thunk from 'redux-thunk';


//
const initialState = getInitialStateRenderer();
//
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

/**
 *
 */
export const downstreamStore = createStore(
    downstreamReducer,
    initialState,
    composeEnhancers(
        applyMiddleware(
            forwardToMain,
            thunk,
            downstreamMiddleware
        )
    )
);

//
replayActionRenderer(downstreamStore);

export const defaultState = {
    streams: [
        {
            'id': '000000',
            'url': 'https://d71nzo856dokb.cloudfront.net/13c07eaa24bb52f651bc1de9d2ec4950cec4227f944319aa/13c07eaa24bb52f651bc1de9d2ec4950cec4227f944319aa.mpd',
            'type': 'DASH',
            'created': false,
            'downloading': false,
            'downloaded': false
        },
        {
            'id': '000001',
            'url': 'https://d71nzo856dokb.cloudfront.net/0fe647f287ee86731b2c1981058ee5e57b1d4f7a58487447/0fe647f287ee86731b2c1981058ee5e57b1d4f7a58487447.mpd',
            'type': 'DASH',
            'created': false,
            'downloading': false,
            'downloaded': false
        }
    ]
};

// get stored movies just after init
downstreamStore.dispatch(downstreamGetListWithInfo());

// NOTE: initially prepare all stream for download
defaultState.streams.forEach(stream => {
    downstreamStore.dispatch(downstreamCreate(stream.id, stream.url));
});

// NOTE: initially get offline links if available
defaultState.streams.forEach(stream => {
    downstreamStore.dispatch(downstreamGetOfflineLink(stream.id));
});
