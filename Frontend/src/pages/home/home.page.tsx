import React from 'react';
import Layout from './../../components/layout/layout';
import { Link } from 'react-router-dom';

const Homepage: React.FC = () => {
  return (
    <Layout>
      <section>
        <h1>My First Homepage</h1>
        <p>This is where the magic happens.</p>
        <Link to="/LoginPage">
          <button>Login Now</button>
        </Link>
      </section>
    </Layout>
  );
};

export default Homepage;