import MagicCard from '../../components/animations/MagicCard';
import TextHighlighter from '../../components/animations/TextHighlighter';
import GradientText from '../../components/animations/GradientText';
import BlurFade from '../../components/animations/BlurFade';
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ToastContext } from '../../context/ToastContext';
import { apiRequest } from '../../api/apiClient';