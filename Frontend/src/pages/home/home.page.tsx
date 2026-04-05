import React from 'react';
import Layout from './../../components/layout/layout';
import { Link } from 'react-router-dom';

const Homepage: React.FC = () => {
  return (
    <Layout>
      <section>
        <h1>My First Homepage</h1>
        <p>Testing the homepage.</p>
        <Link to="/LoginPage">
          <button>Login Now</button>
        </Link>





        <Link to="/RegisterPage">
          <button>Register Now</button>
        </Link>
      </section>
    </Layout>
  );
};

export default Homepage;