import thunk from 'redux-thunk';
import logger from 'redux-logger';
import { createStore, compose, applyMiddleware, combineReducers } from 'redux';
import { routerReducer, routerMiddleware } from 'react-router-redux';

import repositories from './repository/modules/repositories';
import repository from './repository/modules/repository';

function createReduxStore(history) {
    const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

    const reducer = combineReducers({
        router: routerReducer,
        repositories,
        repository
    });

    return createStore(
        reducer,
        composeEnhancers(applyMiddleware(routerMiddleware(history), thunk, logger))
    );
}

export default createReduxStore;
