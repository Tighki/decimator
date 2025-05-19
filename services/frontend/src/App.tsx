import React from 'react';
import {PrivateRoute} from "./components/auth/PrivateRoute";
import {Switch} from "react-router-dom";
import {Route} from "react-router";
import SignIn from "./components/auth/SignIn";
import SignUp from "./components/auth/SignUp";
import HomePage from "./components/Home";
import AdminPanel from "./components/admin/AdminPanel";

const App: React.FC = () => {
  return (
      <React.Fragment>
        <Switch>
          <PrivateRoute exact path='/' component={HomePage}/>
          <PrivateRoute path='/admin' component={AdminPanel}/>
          <Route path={'/login'} component={SignIn}/>
          <Route path={'/registration'} component={SignUp}/>
        </Switch>
      </React.Fragment>
  );
};

export default App;
